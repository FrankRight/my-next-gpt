export interface Thread {
  ID: string; // Assuming UUID is a string in TypeScript
  Metadata?: Record<string, any>; // JSONMap can be represented as an object with string keys and any type of values

  stage: string;
  agent_id: string; // UUID as a string
  env: string;
  name: string;
  user_id: string;
  user: User;
  deployed_id: string;
  status: string;
  tokens: number;
  Time: string;

  approval_data: ApprovalData;
  require_approval: boolean;
  approval_prompt: string;
  approval_code: string;

  // Runs are commented out in your Go struct, so they're omitted here
  messages: Message[] | null; // Assuming you have a Message interface defined elsewhere

  created: number; // Timestamps are represented as numbers in TypeScript (milliseconds since Unix epoch)
  updated: number;
}

export interface ApprovalData {
  approval_prompt: string;
  run_id: string;
  approval_code: string;
  approved: boolean;
  tool_id: string;
}

export interface Message {
  ID: string;
  role: string;
  content: string;
  name?: string | null;

  metadata?: Record<string, any>;
  token_count: number;

  thread_id: string;

  status: string;

  raw_data: string;
  tool_calls: string;
  tool_calls_output: string;
  tool_calls_output_str: string;
  thread_run_work_flow_id: string;

  created: number; // Timestamps as numbers (milliseconds since Unix epoch)
  updated: number;
}

export interface User {
  id: string;
  ID: string;
  email: string;
  uid: string;
  agents: Agent;
  created: any;
  updated: any;
  last_seen: any;
  email_confirmed: boolean;
  blocked: boolean;
  org_id: any;
  first_name: string;
  last_name: string;
}

export interface Agent {
  ID: string;
  name: string;
  slug: string;
  backend: string;
  description: string;
  instructions: string;
  user_id: string;
  user: User2;
  sources: any;
  threads: any;
  created: number;
  updated: number;
}

export interface User2 {
  ID: string;
  email: string;
  uid: string;
  email_confirmed: boolean;
  blocked: boolean;
  org_id: string;
  agents: any;
  created: number;
  updated: number;
  last_seen: number;
}
