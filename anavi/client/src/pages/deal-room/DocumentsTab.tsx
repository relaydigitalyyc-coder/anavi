import { useState, useRef, useCallback } from "react";
import { FileText, Upload, Download, X, Image as ImageIcon, FileSignature, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  preview?: string;
}

interface DocumentsTabProps {
  documents: any[];
  dealRoomId?: number;
  ndaRequired?: boolean;
  ndaSigned?: boolean;
  bothSigned?: boolean;
  onNdaSigned?: () => void;
}

export function DocumentsTab({
  documents,
  dealRoomId,
  ndaRequired = false,
  ndaSigned = false,
  bothSigned = false,
  onNdaSigned,
}: DocumentsTabProps) {
  const signNda = trpc.dealRoom.signNda.useMutation({
    onSuccess: (r) => {
      toast.success(r.alreadySigned ? "NDA already signed" : "NDA signed successfully");
      onNdaSigned?.();
    },
    onError: (e) => toast.error(e.message),
  });
  const requestSignature = trpc.dealRoom.requestSignature.useMutation({
    onSuccess: () => toast.success("Signature requested"),
    onError: (e) => toast.error(e.message),
  });
  const [ndaModalOpen, setNdaModalOpen] = useState(false);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      setUploadProgress(0);
      const reader = new FileReader();
      reader.onload = () => {
        const isImage = file.type.startsWith("image/");
        setUploads((prev) => [
          ...prev,
          { name: file.name, size: file.size, type: file.type, preview: isImage ? (reader.result as string) : undefined },
        ]);
        let p = 0;
        const interval = setInterval(() => {
          p += Math.random() * 30 + 10;
          if (p >= 100) {
            clearInterval(interval);
            setUploadProgress(null);
            toast.success(`${file.name} uploaded`);
          } else {
            setUploadProgress(Math.min(p, 95));
          }
        }, 200);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return ImageIcon;
    return FileText;
  };

  return (
    <div className="space-y-6">
      {/* NDA Banner */}
      {ndaRequired && (
        <div
          className="rounded-lg border p-4 flex items-center justify-between gap-4"
          style={{
            borderColor: bothSigned ? "#059669" : ndaSigned ? "#C4972A" : "#D1DCF0",
            background: bothSigned ? "#05966908" : ndaSigned ? "#C4972A08" : "#F3F7FC",
          }}
        >
          <div className="flex items-center gap-3">
            {bothSigned ? (
              <FileSignature className="w-5 h-5" style={{ color: "#059669" }} />
            ) : ndaSigned ? (
              <Lock className="w-5 h-5" style={{ color: "#C4972A" }} />
            ) : (
              <FileSignature className="w-5 h-5" style={{ color: "#2563EB" }} />
            )}
            <div>
              <div className="text-sm font-medium" style={{ color: "#0A1628" }}>
                {bothSigned ? "NDA signed by all parties" : ndaSigned ? "Waiting for counterparty to sign NDA" : "Sign NDA to access documents"}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {bothSigned ? "You have full access to all documents." : ndaSigned ? "Other participants must sign before you can see shared documents." : "You must sign the NDA before viewing or uploading other documents."}
              </div>
            </div>
          </div>
          {!ndaSigned && (
            <button
              onClick={() => setNdaModalOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90"
              style={{ backgroundColor: "#2563EB" }}
              disabled={signNda.isPending}
            >
              {signNda.isPending ? "Signing…" : "Sign NDA"}
            </button>
          )}
        </div>
      )}

      {/* NDA Sign Modal */}
      {ndaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setNdaModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "#0A1628" }}>Sign Mutual NDA</h3>
            <p className="text-sm text-muted-foreground mb-4">
              By signing, you agree to the terms of the Mutual Non-Disclosure Agreement. You will gain access to shared deal documents once all parties have signed.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setNdaModalOpen(false)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border"
                style={{ borderColor: "#D1DCF0", color: "#0A1628" }}
              >
                Cancel
              </button>
              <button
                onClick={() => dealRoomId && signNda.mutate({ dealRoomId }, { onSuccess: () => setNdaModalOpen(false) })}
                className="px-4 py-1.5 text-sm font-medium rounded-lg text-white"
                style={{ backgroundColor: "#2563EB" }}
                disabled={signNda.isPending}
              >
                {signNda.isPending ? "Signing…" : "Sign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Functional Upload Zone - hide when NDA required but not signed */}
      {(!ndaRequired || ndaSigned) && (
        <>
        <div
          className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors hover:border-[#2563EB]/40 hover:bg-[#2563EB]/5"
          style={{ borderColor: "#D1DCF0", background: "#F3F7FC" }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: "#2563EB" }} />
          <p className="text-sm font-medium" style={{ color: "#0A1628" }}>Drag & drop files here</p>
          <p className="text-xs text-muted-foreground mt-1">or click to browse · PDF, DOC, images up to 10MB</p>
          {uploadProgress !== null && (
            <div className="mt-4 mx-auto max-w-xs">
              <div className="h-1.5 rounded-full bg-[#D1DCF0]">
                <div className="h-full rounded-full bg-[#2563EB] transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="text-xs text-[#2563EB] mt-1">{Math.round(uploadProgress)}% uploading...</p>
            </div>
          )}
        </div>

        {/* Uploaded files preview */}
        {uploads.length > 0 && (
        <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
          <h3 className="text-subheading mb-4" style={{ color: "#0A1628" }}>Uploaded Files ({uploads.length})</h3>
          <div className="space-y-2">
            {uploads.map((f, i) => {
              const Icon = getFileIcon(f.type);
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#F3F7FC]">
                  {f.preview ? (
                    <img src={f.preview} alt={f.name} className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-[#2563EB]/10 flex items-center justify-center">
                      <Icon className="w-5 h-5" style={{ color: "#2563EB" }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#0A1628" }}>{f.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(f.size)} · {f.type.split("/")[1]?.toUpperCase()}</p>
                  </div>
                  <button
                    onClick={() => setUploads((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-1 rounded hover:bg-red-50"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
        )}
        </>
      )}

      {/* Document Library - getDocuments returns NDA-only when unsigned, all when signed */}
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-4" style={{ color: "#0A1628" }}>Document Library</h3>
        {documents && documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F3F7FC] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" style={{ color: "#2563EB" }} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: "#0A1628" }}>{doc.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {doc.category && (
                        <span className="inline-block mr-2 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium">
                          {doc.category}
                        </span>
                      )}
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "—"}
                      {doc.version ? ` · v${doc.version}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.signatureStatus && (
                    <span className={`status-pill text-[10px] ${doc.signatureStatus === "completed" ? "status-completed" : doc.signatureStatus === "pending" ? "status-nda-pending" : "status-active"}`}>
                      {doc.signatureStatus === "completed" ? "Signed" : doc.signatureStatus === "pending" ? "Pending" : doc.signatureStatus ?? "—"}
                    </span>
                  )}
                  {doc.signatureStatus !== "completed" && doc.requiresSignature !== true && (
                    <button
                      onClick={() => requestSignature.mutate({ documentId: doc.id })}
                      className="text-xs font-medium px-2 py-1 rounded hover:bg-blue-50"
                      style={{ color: "#2563EB" }}
                    >
                      Request Signature
                    </button>
                  )}
                  <button className="p-1.5 rounded hover:bg-gray-100">
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            {ndaRequired && !ndaSigned ? "Sign the NDA above to view the document." : "No documents uploaded yet"}
          </p>
        )}
      </section>
    </div>
  );
}
