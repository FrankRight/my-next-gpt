"use client";

import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Bot, Edit, Plus, Trash, User } from "lucide-react";

import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  useDeleteMutation,
  useMutation,
  useUpdateMutation,
} from "@/hooks/base";
import { useQuery } from "@/hooks/useFetch";
import { Message, Thread } from "@/lib/types";
import { DotsThree } from "@phosphor-icons/react";
import { PopoverContent } from "@radix-ui/react-popover";
import Pusher from "pusher-js";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchEventSource } from "@microsoft/fetch-event-source";

const DEPLOYMENT_ID = process.env.NEXT_PUBLIC_DEPLOYMENT_ID;

export default function Home() {
  const [agentId, setAgentId] = useState("");
  const [selectedThreadId, setSelectedId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progressBarmessage, setProgressBarMessage] = useState("");
  const [outputMessage, setOutputMessage] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [openPopover, setOpenPopover] = useState(false);
  const [callId, setCallId] = useState("");

  // Get Deployment
  const { data: deployment, isLoading: isLoadingDeployment } = useQuery(
    DEPLOYMENT_ID ? `deploy/${DEPLOYMENT_ID}` : ""
  );

  // Create a thread Mutation
  const { trigger: triggerThread } = useMutation(
    `deploy/chat/${DEPLOYMENT_ID}/threads`
  );

  // Add a message Mutation
  const { trigger: triggerMessage } = useMutation(
    `deploy/chat/${DEPLOYMENT_ID}/threads/${selectedThreadId}/messages`
  );

  // Run a thread
  const { trigger: triggerRun } = useMutation(
    `deploy/chat/${DEPLOYMENT_ID}/threads/${selectedThreadId}/runs`
  );

  // Generate thread name
  const { trigger: triggerGenerateName } = useMutation(
    `deploy/${DEPLOYMENT_ID}/generate-name`
  );

  // Update Thread name
  const { trigger: triggerUpdateName } = useUpdateMutation(
    `deploy/chat/${DEPLOYMENT_ID}/thread/${selectedThreadId}`
  );

  // Get Threads
  const {
    data: threads,
    isLoading: loadingThreads,
    mutate: mutateThreads,
  } = useQuery(DEPLOYMENT_ID ? `deploy/chat/${DEPLOYMENT_ID}/threads` : "");

  // deleteThread
  const { trigger: deleteThreadTrigger, isMutating: deletingThread } =
    useDeleteMutation(
      `deploy/chat/${DEPLOYMENT_ID}/thread/${selectedThreadId}`
    );

  // Get Thread
  const {
    data: thread,
    isLoading: loadingThread,
    mutate: mutateThread,
  } = useQuery(
    DEPLOYMENT_ID && selectedThreadId && !deletingThread
      ? `deploy/chat/${DEPLOYMENT_ID}/thread/${selectedThreadId}`
      : ""
  );

  // console.log(thread);

  useEffect(() => {
    if (deployment) {
      setAgentId(deployment?.data?.agent_id);
    }
  }, [deployment]);

  useEffect(() => {
    const fetchData = async () => {
      if (callId && callId != "") {
        await fetchEventSource(`http://localhost:3039/events/${callId}`, {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
          },
          onopen(res): any {
            if (res.ok && res.status === 200) {
              console.log("Connection made ", res);
            } else if (
              res.status >= 400 &&
              res.status < 500 &&
              res.status !== 429
            ) {
              console.log("Client side error ", res);
            }
          },
          onmessage(event) {
            const parsedData = JSON.parse(event.data);

            if (parsedData.completed) {
              setIsLoading(false);
            } else {
              setProgressBarMessage(parsedData.payload);
              setIsLoading(true);
            }
            mutateThreads();
            mutateThread();
          },
          onclose() {
            console.log("Connection closed by the server");
          },
          onerror(err) {
            console.log("There was an error from server", err);
            setIsLoading(false);
          },
        });
      }
    };

    fetchData();
  }, [callId]);

  const generateThreadName = (_message: string) => {
    triggerGenerateName({ value: _message } as any).then((res) => {
      if (res.success) {
        // Update name
        triggerUpdateName({
          ...thread?.data,
          name: res.data.replace(/["\\]/g, ""),
        }).then((response) => {
          if (response.success) {
            toast("Name Updated!");
            mutateThreads();
            mutateThread();
          }
        });
      }
    });
  };

  const createThread = async () => {
    try {
      const result = await triggerThread({
        agent_id: agentId,
        env: deployment?.data?.environment,
      } as any);

      if (result.success) {
        const data = result.data;
        setSelectedId(data.ID);
        mutateThreads();

        return data.ID;
      }
    } catch (e) {
      // error handling

      return;
    }
  };

  const runThread = () => {
    triggerRun({ agent_id: agentId } as any).then((response) => {
      let call_id = response.data.call_id;

      setCallId(call_id);
    });
  };

  const addMessageToThread = (message: string) => {
    const addMessage = () => {
      triggerMessage({ role: "user", content: message } as any).then(
        (res: any) => {
          setUserMessage("");
          setIsLoading(true);

          if (!thread?.data?.name) {
            generateThreadName(message);
          }

          runThread();
        }
      );
    };

    if (!selectedThreadId) {
      // Create Thread
      createThread().then((res) => {
        // console.log("Thread Created!! Now Send Message!");
        // console.log(res);

        if (res) {
          setTimeout(addMessage, 500);
        }
      });
    } else {
      addMessage();
    }
  };

  const onEnterInput = (event: any) => {
    if (event.key === "Enter") {
      const messageToSend = event.target.value;
      addMessageToThread(messageToSend);
    }
  };

  const deleteThread = () => {
    setOpenPopover(false);

    deleteThreadTrigger().then((res: any) => {
      setSelectedId("");
      // console.log("Delete", res);
      if (res.success) {
        toast("Thread Deleted Successfully!");

        mutateThreads();
      } else {
        toast("Thread Deletion Failed!");
      }
    });
  };

  return (
    <main className="flex min-h-screen w-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={15} maxSize={20} minSize={15}>
          <div className="flex h-[100vh] bg-slate-50 overflow-auto flex-col p-4">
            <Button
              variant="ghost"
              onClick={createThread}
              className="flex gap-2 bg-slate-200 hover:bg-black hover:text-white text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">New Chat</span>
            </Button>
            <div className="text-sm py-5">
              <h4 className="text-gray-500 px-3 text-xs">Recent Chats</h4>

              <div className="mt-3">
                {threads?.data.map((thread: Thread) => {
                  return (
                    <div
                      key={thread?.ID}
                      onClick={() => setSelectedId(thread?.ID)}
                      className={`py-2 px-3 cursor-pointer capitalize rounded-lg ${
                        selectedThreadId === thread?.ID
                          ? "bg-slate-200"
                          : "hover:bg-slate-100"
                      } flex justify-between group`}
                    >
                      <span
                        className={`overflow-hidden flex ${
                          selectedThreadId === thread?.ID
                            ? "w-[80%] truncate"
                            : "w-[98%] truncate"
                        }`}
                      >
                        {thread?.name == "" ? "new chat" : thread?.name}
                      </span>

                      {selectedThreadId === thread?.ID && (
                        <Popover
                          open={openPopover}
                          onOpenChange={setOpenPopover}
                        >
                          <PopoverTrigger className="z-20">
                            <DotsThree className="w-5 h-5" />
                          </PopoverTrigger>

                          <PopoverContent className="bg-white p-2 rounded-lg min-w-32 border shadow z-20">
                            <div>
                              <div className="hover:bg-slate-50 cursor-pointer p-1 flex items-center gap-2">
                                <Edit className="w-4 h-4 text-gray-500" /> Edit
                              </div>
                              <div
                                className="hover:bg-slate-50 cursor-pointer p-1 flex items-center gap-2"
                                onClick={deleteThread}
                              >
                                <Trash className="w-4 h-4 text-gray-500" />{" "}
                                Delete
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={85} maxSize={85} minSize={80}>
          <div className="flex flex-col w-full h-[100vh] overflow-auto p-4">
            <div className="h-[calc(100vh-100px)] overflow-auto">
              <div className="container max-w-4xl mx-auto p-4 flex flex-col">
                {thread?.data.messages.map((message: Message) => {
                  return (
                    <div key={message?.ID} className="">
                      {message?.content && (
                        <div className="py-2 w-full text-sm mb-2">
                          <div>
                            {message?.role === "user" ? (
                              <div className="flex gap-2 items-center">
                                <span className="p-[5px] border rounded-full">
                                  <User className="w-4 h-4 text-gray-500" />
                                </span>
                                <span className="font-semibold">User</span>
                              </div>
                            ) : (
                              <div className="flex gap-2 items-center">
                                <span className="p-[5px] border rounded-full">
                                  <Bot className="w-4 h-4 text-gray-500" />
                                </span>
                                <span className="font-semibold">Bot</span>
                              </div>
                            )}
                          </div>

                          <div className="pl-9 my-2">{message?.content}</div>
                          {/* <div></div> */}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div>
                  {isLoading && (
                    <div>
                      <div className="flex gap-2 items-center">
                        <span className="p-[5px] border rounded-full">
                          <Bot className="w-4 h-4 text-gray-500" />
                        </span>
                        <span className="font-semibold">Bot</span>
                      </div>
                      <span className="pl-9 text-sm">
                        Processing.. {progressBarmessage}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full">
              <Textarea
                className="max-w-4xl mx-auto px-4"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Enter a message (Please enter to Send)"
                onKeyDown={onEnterInput}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
