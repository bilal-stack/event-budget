export interface Event {
  id: string;
  title: string;
  date: string;
  currency: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  budgetItems?: BudgetItem[];
  budgetSummary?: BudgetSummary;
  _count?: { budgetItems: number };
}

export interface BudgetItem {
  id: string;
  category: string;
  description: string;
  amount: string | number;
  currency: string;
  eventId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  totalSpend: number;
  byCategory: Record<string, number>;
}

export interface AiProposalItem {
  category: string;
  description: string;
  amount: number;
  currency: string;
}

export interface AiProposal {
  id: string;
  eventId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  items: AiProposalItem[];
  createdAt: string;
}
