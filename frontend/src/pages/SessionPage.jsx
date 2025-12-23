import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { useEndSession, useJoinSession, useSessionById } from "../hooks/useSessions";
import { sessionApi } from "../api/sessions";
import { PROBLEMS } from "../data/problems";
import { executeCode } from "../lib/piston";
import Navbar from "../components/Navbar";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { getDifficultyBadgeClass } from "../lib/utils";
import { Loader2Icon, LogOutIcon, PhoneOffIcon } from "lucide-react";
import CodeEditorPanel from "../components/CodeEditorPanel";
import OutputPanel from "../components/OutputPanel";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

import useStreamClient from "../hooks/useStreamClient";
import { StreamCall, StreamVideo } from "@stream-io/video-react-sdk";
import VideoCallUI from "../components/VideoCallUI";

function SessionPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [joinedViaInvite, setJoinedViaInvite] = useState(false);
  const [needsAccessCode, setNeedsAccessCode] = useState(false);

  const { data: sessionData, isLoading: loadingSession, refetch } = useSessionById(id);

  const joinSessionMutation = useJoinSession();
  const endSessionMutation = useEndSession();

  const session = sessionData?.session;
  const participants = session?.participants || [];
  const isHost = session?.host?.clerkId === user?.id;
  const isParticipant = participants.some((p) => p?.clerkId === user?.id);

  const { call, channel, chatClient, isInitializingCall, streamClient } = useStreamClient(
    session,
    loadingSession,
    isHost,
    isParticipant
  );

  // find the problem data based on session problem title
  const problemData = session?.problem
    ? Object.values(PROBLEMS).find((p) => p.title === session.problem)
    : null;

  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState(problemData?.starterCode?.[selectedLanguage] || "");
  const [showSolution, setShowSolution] = useState(false);

  const { search } = useLocation();

  // auto-join session if user is not already a participant and not the host
  useEffect(() => {
    if (!session || !user || loadingSession) return;
    if (isHost || isParticipant) return;

    (async () => {
      let joined = false;

      // 1) Try invite-based join first (if token present)
      const params = new URLSearchParams(search);
      const invite = params.get('invite');
      if (invite) {
        try {
          const res = await sessionApi.joinWithInvite(invite);
          if (res && res.session) {
            setJoinedViaInvite(true);
            refetch();
            joined = true;
          }
        } catch (e) {
          console.error('Invite-based join failed, falling back to normal join', e);
        }
      }

      if (joined) return;

      // 2) If session is protected, show join button instead of auto prompt
      if (session.isProtected) {
        setNeedsAccessCode(true);
        return;
      }

      // 3) Otherwise join normally
      try {
        joinSessionMutation.mutate(id, { onSuccess: refetch });
      } catch (e) {
        console.error('Auto-join failed', e);
      }
    })();
  }, [session, user, loadingSession, isHost, isParticipant, id, search]);

  const handleJoinAsParticipant = () => {
    if (!session) return;

    // Protected sessions: ask for access code via user-initiated prompt
    if (session.isProtected) {
      const code = window.prompt('This session requires an access code. Please enter it:');
      if (code === null) return;
      joinSessionMutation.mutate({ id, accessCode: code }, { onSuccess: refetch });
      return;
    }

    // Unprotected sessions: join directly
    joinSessionMutation.mutate(id, { onSuccess: refetch });
  };

  // redirect the "participant" when session ends
  useEffect(() => {
    if (!session || loadingSession) return;

    if (session.status === "completed") navigate("/dashboard");
  }, [session, loadingSession, navigate]);

  // update code when problem loads or changes
  useEffect(() => {
    if (problemData?.starterCode?.[selectedLanguage]) {
      setCode(problemData.starterCode[selectedLanguage]);
      setShowSolution(false);
    }
  }, [problemData, selectedLanguage]);

  // Notify host via chat when a participant views the solution
  useEffect(() => {
    const notifyHostOfSolutionView = async () => {
      try {
        if (
          showSolution &&
          isParticipant &&
          !isHost &&
          channel &&
          session?.problem
        ) {
          const displayName = user?.fullName || user?.firstName || user?.username || "Candidate";
          const languageLabel = selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1);

          await channel.sendMessage({
            text: `${displayName} viewed the solution for "${session.problem}" (${languageLabel}).`,
          });
        }
      } catch (err) {
        console.error("Failed to notify host about solution view", err);
      }
    };

    notifyHostOfSolutionView();
  }, [showSolution, isParticipant, isHost, channel, session, selectedLanguage, user]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    // use problem-specific starter code
    const starterCode = problemData?.starterCode?.[newLang] || "";
    setCode(starterCode);
    setOutput(null);
    setShowSolution(false);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 250,
      origin: { x: 0.2, y: 0.6 },
    });

    confetti({
      particleCount: 80,
      spread: 250,
      origin: { x: 0.8, y: 0.6 },
    });
  };

  const normalizeOutput = (outputStr) => {
    if (!outputStr) return "";

    return outputStr
      .trim()
      .split("\n")
      .map((line) =>
        line
          .trim()
          .replace(/\[\s+/g, "[")
          .replace(/\s+\]/g, "]")
          .replace(/\s*,\s*/g, ",")
          .replace(/'/g, '"')
      )
      .filter((line) => line.length > 0)
      .join("\n");
  };

  const checkIfTestsPassed = (actualOutput, expectedOutput) => {
    const normalizedActual = normalizeOutput(actualOutput);
    const normalizedExpected = normalizeOutput(expectedOutput);

    return normalizedActual === normalizedExpected;
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput(null);

    const result = await executeCode(selectedLanguage, code);
    setOutput(result);
    setIsRunning(false);

    // If we know the problem and expected output, show toast based on tests
    if (problemData?.expectedOutput?.[selectedLanguage]) {
      if (result.success) {
        const expectedOutput = problemData.expectedOutput[selectedLanguage];
        const testsPassed = checkIfTestsPassed(result.output, expectedOutput);

        if (testsPassed) {
          triggerConfetti();
          toast.success("All tests passed! Great job!");
          setShowSolution(true);
        } else {
          toast.error("Tests failed. Check your output!");
        }
      } else {
        toast.error("Code execution failed!");
      }
    } else if (result.success) {
      // fallback: for problems without configured expectedOutput
      toast.success("Code ran successfully.");
    } else {
      toast.error("Code execution failed!");
    }
  };

  const handleEndSession = () => {
    if (confirm("Are you sure you want to end this session? All participants will be notified.")) {
      // this will navigate the HOST to dashboard
      endSessionMutation.mutate(id, { onSuccess: () => navigate("/dashboard") });
    }
  };

  const handleShareInvite = async () => {
    try {
      if (!session?._id) return;
      const res = await sessionApi.createInvite(session._id);
      const token = res?.token;
      if (!token) {
        toast.error("Failed to create invite");
        return;
      }
      const link = `${window.location.origin}/session/${session._id}?invite=${token}`;
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied to clipboard");
    } catch (e) {
      console.error("Create invite error", e);
      toast.error("Failed to create invite");
    }
  };

  return (
    <div className="h-screen bg-base-100 flex flex-col">
      <Navbar />

      <div className="flex-1">
        <PanelGroup direction="horizontal">
          {/* LEFT PANEL - CODE EDITOR & PROBLEM DETAILS */}
          <Panel defaultSize={50} minSize={30}>
            <PanelGroup direction="vertical">
              {/* PROBLEM DSC PANEL */}
              <Panel defaultSize={50} minSize={20}>
                <div className="h-full overflow-y-auto bg-base-200">
                  {/* HEADER SECTION */}
                  <div className="p-6 bg-base-100 border-b border-base-300">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h1 className="text-3xl font-bold text-base-content">
                          {session?.problem || "Loading..."}
                        </h1>
                        {problemData?.category && (
                          <p className="text-base-content/60 mt-1">{problemData.category}</p>
                        )}
                        <p className="text-base-content/60 mt-2">
                          Host: {(!joinedViaInvite || isHost) ? (session?.host?.name || "Loading...") : 'Hidden'} •{" "}
                          {1 + participants.length}/2 participants
                        </p>
                        {participants.length > 0 && (
                          <p className="text-base-content/60 mt-1">
                            Candidate: {participants[0]?.name || "Joined"}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`badge badge-lg ${getDifficultyBadgeClass(
                            session?.difficulty
                          )}`}
                        >
                          {session?.difficulty.slice(0, 1).toUpperCase() +
                            session?.difficulty.slice(1) || "Easy"}
                        </span>
                        {isHost && session?.status === "active" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleShareInvite}
                              className="btn btn-outline btn-sm"
                              type="button"
                            >
                              Share invite
                            </button>
                            <button
                              onClick={handleEndSession}
                              disabled={endSessionMutation.isPending}
                              className="btn btn-error btn-sm gap-2"
                              type="button"
                            >
                              {endSessionMutation.isPending ? (
                                <Loader2Icon className="w-4 h-4 animate-spin" />
                              ) : (
                                <LogOutIcon className="w-4 h-4" />
                              )}
                              End Session
                            </button>
                          </div>
                        )}
                        {!isHost && !isParticipant && session?.status === "active" && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={handleJoinAsParticipant}
                          >
                            {session?.isProtected ? "Join with access code" : "Join session"}
                          </button>
                        )}
                        {session?.status === "completed" && (
                          <span className="badge badge-ghost badge-lg">Completed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* problem desc */}
                    {problemData?.description && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <h2 className="text-xl font-bold mb-4 text-base-content">Description</h2>
                        <div className="space-y-3 text-base leading-relaxed">
                          <p className="text-base-content/90">{problemData.description.text}</p>
                          {problemData.description.notes?.map((note, idx) => (
                            <p key={idx} className="text-base-content/90">
                              {note}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* examples section */}
                    {problemData?.examples && problemData.examples.length > 0 && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <h2 className="text-xl font-bold mb-4 text-base-content">Examples</h2>

                        <div className="space-y-4">
                          {problemData.examples.map((example, idx) => (
                            <div key={idx}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="badge badge-sm">{idx + 1}</span>
                                <p className="font-semibold text-base-content">Example {idx + 1}</p>
                              </div>
                              <div className="bg-base-200 rounded-lg p-4 font-mono text-sm space-y-1.5">
                                <div className="flex gap-2">
                                  <span className="text-primary font-bold min-w-[70px]">
                                    Input:
                                  </span>
                                  <span>{example.input}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-secondary font-bold min-w-[70px]">
                                    Output:
                                  </span>
                                  <span>{example.output}</span>
                                </div>
                                {example.explanation && (
                                  <div className="pt-2 border-t border-base-300 mt-2">
                                    <span className="text-base-content/60 font-sans text-xs">
                                      <span className="font-semibold">Explanation:</span>{" "}
                                      {example.explanation}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Constraints */}
                    {problemData?.constraints && problemData.constraints.length > 0 && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <h2 className="text-xl font-bold mb-4 text-base-content">Constraints</h2>
                        <ul className="space-y-2 text-base-content/90">
                          {problemData.constraints.map((constraint, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-primary">•</span>
                              <code className="text-sm">{constraint}</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Solution Section */}
                    {problemData?.solution?.[selectedLanguage] && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-bold text-base-content">Solution</h2>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => setShowSolution((prev) => !prev)}
                          >
                            {showSolution ? "Hide Solution" : "Show Solution"}
                          </button>
                        </div>
                        {showSolution && (
                          <pre className="bg-base-200 rounded-lg p-4 text-sm font-mono overflow-auto whitespace-pre-wrap">
                            {problemData.solution[selectedLanguage]}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

              <Panel defaultSize={50} minSize={20}>
                <PanelGroup direction="vertical">
                  <Panel defaultSize={70} minSize={30}>
                    <CodeEditorPanel
                      selectedLanguage={selectedLanguage}
                      code={code}
                      isRunning={isRunning}
                      onLanguageChange={handleLanguageChange}
                      onCodeChange={(value) => setCode(value)}
                      onRunCode={handleRunCode}
                    />
                  </Panel>

                  <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

                  <Panel defaultSize={30} minSize={15}>
                    <OutputPanel output={output} />
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-2 bg-base-300 hover:bg-primary transition-colors cursor-col-resize" />

          {/* RIGHT PANEL - VIDEO CALLS & CHAT */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full bg-base-200 p-4 overflow-auto">
              {isInitializingCall ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
                    <p className="text-lg">Connecting to video call...</p>
                  </div>
                </div>
              ) : !streamClient || !call ? (
                <div className="h-full flex items-center justify-center">
                  <div className="card bg-base-100 shadow-xl max-w-md">
                    <div className="card-body items-center text-center">
                      <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mb-4">
                        <PhoneOffIcon className="w-12 h-12 text-error" />
                      </div>
                      <h2 className="card-title text-2xl">Connection Failed</h2>
                      <p className="text-base-content/70">Unable to connect to the video call</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <StreamVideo client={streamClient}>
                    <StreamCall call={call}>
                      <VideoCallUI chatClient={chatClient} channel={channel} />
                    </StreamCall>
                  </StreamVideo>
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default SessionPage;