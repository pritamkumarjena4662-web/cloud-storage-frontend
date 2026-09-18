import { useEffect, useState } from "react";
import "./App.css";

const API = "https://cloud-storage-backend-mt47.onrender.com";

function App() {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [userId] = useState(1);
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      const fileRes = await fetch(`${API}/api/files?userId=${userId}`);

      if (fileRes.ok) {
        const data = await fileRes.json();
        setFiles(data);
      }

      const folderRes = await fetch(`${API}/api/folders?userId=${userId}`);

      if (folderRes.ok) {
        const data = await folderRes.json();
        setFolders(data);
      }
    } catch (error) {
      setMessage("Backend connection failed");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const uploadFile = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);

    try {
      const response = await fetch(`${API}/api/files/upload`, {
        method: "POST",
        body: formData,
      });

      const result = await response.text();

      if (response.ok) {
        setMessage("✅ File uploaded successfully!");
        loadData();
      } else {
        setMessage("❌ Upload failed: " + result);
      }
    } catch (error) {
      setMessage("❌ Backend connection failed");
    }

    e.target.value = "";
  };

  const downloadFile = async (id, fileName) => {
    try {
      const response = await fetch(`${API}/api/files/download/${id}`);

      if (!response.ok) {
        setMessage("❌ Download failed");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);

      setMessage("✅ Download started");
    } catch (error) {
      setMessage("❌ Download failed");
    }
  };

  const createFolder = async () => {
    const folderName = prompt("Enter folder name:");

    if (!folderName) return;

    try {
      const body = new URLSearchParams();
      body.append("folderName", folderName);
      body.append("userId", userId);

      const response = await fetch(`${API}/api/folders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body,
      });

      if (response.ok) {
        setMessage("✅ Folder created successfully!");
        loadData();
      } else {
        setMessage("❌ Folder creation failed");
      }
    } catch (error) {
      setMessage("❌ Backend connection failed");
    }
  };

  const filteredFiles = files.filter((file) =>
    file.fileName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalBytes = files.reduce(
    (total, file) => total + (file.fileSize || 0),
    0
  );

  return (
    <div className="app">

      <header className="header">
        <div>
          <h1>☁ Cloud Storage</h1>
          <p>Secure file storage service</p>
        </div>

        <label className="uploadBtn">
          + Upload File
          <input type="file" onChange={uploadFile} hidden />
        </label>
      </header>

      {message && (
        <div className="message">
          {message}
        </div>
      )}

      <div className="actions">
        <button onClick={createFolder}>
          📁 New Folder
        </button>

        <button onClick={loadData}>
          🔄 Refresh
        </button>
      </div>

      <section className="stats">

        <div className="card">
          <span>📄</span>
          <div>
            <h3>{files.length}</h3>
            <p>Total Files</p>
          </div>
        </div>

        <div className="card">
          <span>📁</span>
          <div>
            <h3>{folders.length}</h3>
            <p>Folders</p>
          </div>
        </div>

        <div className="card">
          <span>💾</span>
          <div>
            <h3>{totalBytes}</h3>
            <p>Total Bytes</p>
          </div>
        </div>

      </section>

      <section className="content">

        <div className="sectionTitle">
          <h2>My Files</h2>
          <span>{filteredFiles.length} files</span>
        </div>

        <div className="searchBox">
          🔍
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredFiles.length === 0 ? (

          <div className="empty">
            <div>📂</div>
            <h3>No files found</h3>
            <p>Upload a file or change your search.</p>
          </div>

        ) : (

          <div className="fileGrid">

            {filteredFiles.map((file) => (

              <div className="fileCard" key={file.id}>

                <div className="fileIcon">
                  {file.fileType?.startsWith("image")
                    ? "🖼️"
                    : "📄"}
                </div>

                <div className="fileInfo">

                  <h3 title={file.fileName}>
                    {file.fileName}
                  </h3>

                  <p>
                    {file.fileType || "Unknown type"}
                  </p>

                  <small>
                    {file.fileSize || 0} bytes
                  </small>

                </div>

                <div className="fileActions">

                  <button
                    onClick={() =>
                      downloadFile(file.id, file.fileName)
                    }
                  >
                    Download
                  </button>

                  <button
                    onClick={() =>
                      setSelectedFile(file)
                    }
                  >
                    Details
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

      <section className="content">

        <div className="sectionTitle">
          <h2>My Folders</h2>
          <span>{folders.length} folders</span>
        </div>

        {folders.length === 0 ? (

          <div className="empty small">
            <div>📁</div>
            <p>No folders created.</p>
          </div>

        ) : (

          <div className="folderGrid">

            {folders.map((folder) => (

              <div
                className="folderCard"
                key={folder.id}
              >

                <span>📁</span>

                <div>
                  <h3>{folder.folderName}</h3>
                  <p>Folder ID: {folder.id}</p>
                </div>

              </div>

            ))}

          </div>

        )}

      </section>

      {selectedFile && (

        <div
          className="modalOverlay"
          onClick={() => setSelectedFile(null)}
        >

          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >

            <h2>File Details</h2>

            <p>
              <b>Name:</b> {selectedFile.fileName}
            </p>

            <p>
              <b>Type:</b> {selectedFile.fileType}
            </p>

            <p>
              <b>Size:</b> {selectedFile.fileSize} bytes
            </p>

            <p>
              <b>User ID:</b> {selectedFile.userId}
            </p>

            <p>
              <b>File ID:</b> {selectedFile.id}
            </p>

            <button
              onClick={() => setSelectedFile(null)}
            >
              Close
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;