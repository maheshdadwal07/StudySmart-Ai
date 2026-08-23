import { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../api/client';

export function useDocumentUpload(onSuccess) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [fileName, setFileName] = useState('');
  
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const uploadFile = async (file) => {
    if (!file) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const allowedExtensions = ['pdf', 'docx'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExt)) {
      setErrorMessage('Unsupported file type. Please upload a PDF or DOCX file.');
      setStatus('error');
      return;
    }

    const maxSizeMB = 10;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      setErrorMessage(`File is too large. Maximum size is ${maxSizeMB} MB.`);
      setStatus('error');
      return;
    }

    setFileName(file.name);
    setStatus('uploading');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiFetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setStatus('success');
        if (res.status === 200) {
          setErrorMessage('This file has already been uploaded.');
          setStatus('success'); // keep it as success, but we can just use a slightly different success message
        }
        if (onSuccess) {
          await onSuccess();
        }
        timerRef.current = setTimeout(() => {
          setStatus('idle');
          setFileName('');
          setErrorMessage('');
        }, 3000);
      } else {
        const err = await res.json();
        setErrorMessage(err.detail || 'The document could not be uploaded. Please try again.');
        setStatus('error');
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('The document could not be uploaded. Please try again.');
      setStatus('error');
    }
  };

  const reset = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setStatus('idle');
    setErrorMessage('');
    setFileName('');
  };

  return { status, errorMessage, fileName, uploadFile, reset };
}
