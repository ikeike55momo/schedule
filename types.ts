// 正しい型定義の例
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface DocumentMetadata {
  id: string;
  name: string;
  path: string;
  size: number;
  createdAt: Date;
}