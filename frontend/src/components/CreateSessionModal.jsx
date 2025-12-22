import { useState } from "react";
import { useCreateSession } from "../hooks/useSessions";
import { PROBLEMS, LANGUAGE_CONFIG } from "../data/problems";
import { Loader2Icon, XIcon } from "lucide-react";
import toast from "react-hot-toast";

function CreateSessionModal({ isOpen, onClose }) {
  // 1. Ensure the default state matches a key in your LANGUAGE_CONFIG exactly
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [selectedProblemId, setSelectedProblemId] = useState("two-sum");
  const [accessCode, setAccessCode] = useState("");
  
  const createSessionMutation = useCreateSession();

  if (!isOpen) return null;

  const handleCreateSession = async () => {
    try {
      // send the problem title and difficulty so backend and frontend agree
      const problemObj = PROBLEMS[selectedProblemId];
      await createSessionMutation.mutateAsync({
        problem: problemObj.title,
        difficulty: problemObj.difficulty || "Easy",
        language: selectedLanguage,
        accessCode: accessCode || undefined,
      });
      toast.success("Session created successfully!");
      onClose();
    } catch (error) {
      console.error("Create session error:", error);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box bg-base-100 border border-base-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Create New Session</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <XIcon className="size-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* LANGUAGE SELECTION */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Select Language</span>
            </label>
            <div className="flex items-center gap-3 bg-base-200 p-3 rounded-lg border border-base-300">
              {/* FIX: Use Optional Chaining (?.) to prevent the "icon" error */}
              {LANGUAGE_CONFIG[selectedLanguage]?.icon ? (
                <img
                  src={LANGUAGE_CONFIG[selectedLanguage].icon}
                  alt={LANGUAGE_CONFIG[selectedLanguage]?.name || "Lang"}
                  className="size-8 object-contain"
                />
              ) : (
                <div className="size-8 bg-base-300 rounded animate-pulse" />
              )}
              
              <select
                className="select select-bordered w-full"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                {Object.entries(LANGUAGE_CONFIG).map(([key, lang]) => (
                  <option key={key} value={key}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PROBLEM SELECTION */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Select Problem</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={selectedProblemId}
              onChange={(e) => setSelectedProblemId(e.target.value)}
            >
              {Object.values(PROBLEMS).map((problem) => (
                <option key={problem.id} value={problem.id}>
                  {problem.title} ({problem.difficulty})
                </option>
              ))}
            </select>
          </div>

          {/* ACCESS CODE */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Access Code (optional)</span>
            </label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter an access code to protect the session"
              className="input input-bordered w-full"
            />
          </div>

          <div className="modal-action">
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary min-w-[120px]"
              onClick={handleCreateSession}
              disabled={createSessionMutation.isPending}
            >
              {createSessionMutation.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                "Create Session"
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
    </div>
  );
}

export default CreateSessionModal;