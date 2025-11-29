import { Timestamp } from 'firebase/firestore';

export interface Expense {
  id?: string;
  item: string;
  amount: number;
  category: string;
  createdAt?: Timestamp | any;
  originalText?: string;
}

export interface Message {
  id: string | number;
  type: 'user' | 'bot';
  text: string;
  image?: string;
  data?: Expense[];
}

export type AgentStatus = 'idle' | 'vision' | 'parsing' | 'ledger' | 'summary';

export interface CategoryStat {
  name: string;
  amount: number;
  percentage: number;
  fill: string;
}
