export interface Friend {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  photo?: string;
}

export interface Expense {
  id:string;
  description: string;
  amount: number;
  paidById: string;
  splitWith: string[];
}

export interface Trip {
  id: string;
  name: string;
  date: string;
  members: string[];
  expenses: Expense[];
}

export interface Balance {
  friendId: string;
  amount: number;
}

export interface Settlement {
  from: string; // Friend ID
  to: string; // Friend ID
  amount: number;
}