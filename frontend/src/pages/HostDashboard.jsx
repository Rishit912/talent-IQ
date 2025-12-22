import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import { sessionApi } from '../api/sessions'
import { useNavigate } from 'react-router'
import toast from 'react-hot-toast'

export default function HostDashboard() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useUser()
  const clerkId = user?.id

  const { data, isLoading, isError } = useQuery({
    queryKey: ['hostActiveSessions'],
    queryFn: () => sessionApi.getHostActiveSessions(),
  })

  const joinMutation = useMutation({
    mutationFn: (id) => sessionApi.joinSession(id),
    onSuccess: (res) => {
      toast.success('Joined session')
      queryClient.invalidateQueries(['hostActiveSessions'])
      if (res?.session?._id) navigate(`/session/${res.session._id}`)
    },
    onError: (err) => {
      toast.error('Failed to join session')
      console.error('Join error', err)
    }
  })


  if (isLoading) return <div className="p-6">Loading sessions...</div>
  if (isError) return <div className="p-6">Failed to load sessions</div>

  const sessions = data?.sessions || []

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Host Dashboard — Active Sessions</h2>
      {sessions.length === 0 && (
        <div>
          <div>No active sessions found.</div>
          <details className="mt-3 p-3 bg-base-100 rounded-md">
            <summary className="cursor-pointer">Raw response (debug)</summary>
            <pre className="text-sm mt-2">{JSON.stringify(data, null, 2)}</pre>
          </details>
        </div>
      )}
      <div className="space-y-4">
        {sessions.map((s) => (
          <div key={s._id} className="p-4 bg-base-200 rounded-md flex items-center justify-between">
            <div>
              <div className="font-semibold">{s.problem}</div>
              <div className="text-sm text-base-content/60">{s.difficulty} • Host: {s.host?.name || '—'}</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (s.isProtected) {
                    const code = window.prompt('This session requires an access code. Enter it to join:');
                    if (code === null) return;
                    joinMutation.mutate({ id: s._id, accessCode: code });
                  } else {
                    joinMutation.mutate(s._id);
                  }
                }}
                className={`px-4 py-2 rounded-md ${s.host?.clerkId === clerkId ? 'bg-base-200 text-base-content/60 cursor-not-allowed' : 'bg-primary text-primary-content'}`}
                disabled={s.host?.clerkId === clerkId}
                title={s.host?.clerkId === clerkId ? 'You are the host of this session' : 'Join session'}
              >
                {s.host?.clerkId === clerkId ? 'Host' : 'Join'}
              </button>
              <button onClick={() => navigate(`/session/${s._id}`)} className="px-4 py-2 rounded-md border">
                Open
              </button>
                {s.host?.clerkId === clerkId && (
                  <button
                    onClick={async () => {
                      try {
                        const res = await sessionApi.createInvite(s._id);
                        const token = res?.token;
                        if (token) {
                          const link = `${window.location.origin}/session/${s._id}?invite=${token}`;
                          await navigator.clipboard.writeText(link);
                          toast.success('Invite link copied to clipboard');
                        } else {
                          toast.error('Failed to create invite');
                        }
                      } catch (e) {
                        console.error('Create invite error', e);
                        toast.error('Failed to create invite');
                      }
                    }}
                    className="px-3 py-2 rounded-md border text-sm"
                  >
                    Share
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
