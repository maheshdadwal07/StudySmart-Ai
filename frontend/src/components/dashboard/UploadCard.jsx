import React from 'react';
import { Upload } from 'lucide-react';

export default function UploadCard() {
  return (
    <div className="panel" style={{ marginBottom: 0 }}>
      <div className="panel-head">
        <h3>Upload New Document</h3>
      </div>
      <div className="upload-cta">
        <Upload size={34} color="#9AA1AE" strokeWidth={1.7} style={{ margin: '0 auto 12px' }} />
        <div className="t">Drag &amp; drop a file</div>
        <div className="s">PDF, DOCX, PPTX or TXT — up to 25MB</div>
      </div>
    </div>
  );
}
