import React, { useState, useEffect, useRef } from "react";
import { Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import StatCard from "../components/dashboard/StatCard";
import WeeklyActivityChart from "../components/dashboard/WeeklyActivityChart";
import RecentUploads from "../components/dashboard/RecentUploads";
import ProgressCard from "../components/dashboard/ProgressCard";
import { statCardsData, quickActionsData } from "../data/dashboardData";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../api/client";
import { useDocumentUpload } from "../hooks/useDocumentUpload";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(statCardsData);

  const firstName = user?.name?.split(" ")[0] || "User";

  const fetchDashboardData = async () => {
    try {
      const res = await apiFetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        const docs = data.items || [];
        setDocuments(docs);

        // update stats for documents and storage
        const totalSize = docs.reduce(
          (acc, d) => acc + (d.file_size_bytes || 0),
          0,
        );
        const mb = (totalSize / (1024 * 1024)).toFixed(1);
        const sizeStr =
          mb > 0 ? `${mb} MB` : `${Math.round(totalSize / 1024)} KB`;

        setStats((prevStats) =>
          prevStats.map((s) => {
            if (s.id === "documents")
              return { ...s, value: docs.length.toString() };
            if (s.id === "storage") return { ...s, value: sizeStr };
            return s;
          }),
        );
      }

      const statsRes = await apiFetch("/api/dashboard/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats((prevStats) =>
          prevStats.map((s) => {
            if (s.id === "questions")
              return { ...s, value: statsData.questions_generated };
            if (s.id === "learning")
              return { ...s, value: statsData.learning_progress };
            return s;
          }),
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const { status, errorMessage, fileName, uploadFile } =
    useDocumentUpload(fetchDashboardData);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = null; // reset input so same file can be chosen again
    await uploadFile(file);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".pdf,.docx,.doc"
        onChange={handleFileChange}
      />

      <div className="page-head">
        <div>
          <h1>Good morning, {firstName} 👋</h1>
          <p>Here's what's happening with your study material today.</p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "8px",
          }}
        >
          <Button
            variant="primary"
            onClick={handleUploadClick}
            disabled={status === "uploading"}
          >
            <Upload size={15} strokeWidth={2} />
            {status === "uploading" ? "Uploading..." : "Upload Document"}
          </Button>

          {status === "uploading" && (
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Uploading {fileName}...
            </div>
          )}
          {status === "success" && (
            <div
              style={{
                fontSize: "13px",
                color: "var(--success-text)",
                fontWeight: 500,
              }}
            >
              {errorMessage || "Upload complete"}
            </div>
          )}
          {status === "error" && (
            <div style={{ fontSize: "13px", color: "var(--error-text)" }}>
              {errorMessage}
            </div>
          )}
        </div>
      </div>

      <div className="stat-grid">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="grid-2col">
        {/* LEFT COLUMN */}
        <div>
          <WeeklyActivityChart />
          <RecentUploads documents={documents} />
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <ProgressCard />

          <div className="panel">
            <div className="panel-head">
              <h3>Quick Actions</h3>
            </div>
            <div className="quick-actions">
              {quickActionsData.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <div
                    className="quick-action"
                    key={idx}
                    onClick={() => navigate(action.route)}
                    style={{ cursor: "pointer" }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && navigate(action.route)
                    }
                  >
                    <div className="qi">
                      <Icon
                        size={16}
                        color={action.iconColor}
                        strokeWidth={1.6}
                      />
                    </div>
                    <div>
                      <div className="qt">{action.title}</div>
                      <div className="qs">{action.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="panel"
            style={{ marginBottom: 0, cursor: "pointer" }}
            onClick={handleUploadClick}
          >
            <div className="panel-head">
              <h3>Upload New Document</h3>
            </div>
            <div className="upload-cta">
              <Upload
                size={34}
                color="#9AA1AE"
                strokeWidth={1.7}
                style={{ margin: "0 auto 12px" }}
              />
              <div className="t">
                {status === "uploading"
                  ? "Uploading..."
                  : "Click or Drag & drop a file"}
              </div>
              <div className="s">PDF or DOCX — up to 10MB</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
