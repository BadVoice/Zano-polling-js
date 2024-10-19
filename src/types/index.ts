export type ServiceEntriesData = {
  body: string;
  flags: number;
  instruction: string;
  security: string;
  service_id: string;
}

export type SubtransferData = {
  amount: number;
  asset_id: string;
  is_income: boolean;
}

export enum TxStatus {
  'finished' = 'finished',
  'failed' = 'failed',
  'unknown' = 'unknown',
  'updating' = 'updating'
}

export type TransactionDetail = {
  amount: number;
  blob: string;
  blob_size: number;
  fee: number;
  id: string;
  keeper_block: number;
  object_in_json: string;
  pub_key: string;
  timestamp: number;
}

export type EmployedEntryReceive = {
  amount: number;
  asset_id: string;
  index: number;
}

export type EmployedEntries = {
  receive: EmployedEntryReceive[];
}

export type TransactionData = {
  comment: string;
  employed_entries: EmployedEntries;
  fee: number;
  height: number;
  is_mining: boolean;
  is_mixing: boolean;
  is_service: boolean;
  payment_id: string;
  remote_addresses: string[];
  service_entries: ServiceEntriesData[];
  show_sender: boolean;
  subtransfers: SubtransferData[];
  timestamp: number;
  transfer_internal_index: number;
  tx_blob_size: number;
  tx_hash: string;
  tx_type: number;
  unlock_time: number;
}

export type BlockData = {
  actual_timestamp: number;
  already_generated_coins: string;
  base_reward: number;
  blob: string;
  block_cumulative_size: number;
  block_tself_size: number;
  cumulative_diff_adjusted: string;
  cumulative_diff_precise: string;
  difficulty: string;
  effective_fee_median: number;
  height: number;
  id: string;
  is_orphan: boolean;
  miner_text_info: string;
  object_in_json: string;
  penalty: number;
  pow_seed: string;
  prev_id: string;
  summary_reward: number;
  this_block_fee_median: number;
  timestamp: number;
  total_fee: number;
  total_txs_size: number;
  transactions_details: TransactionDetail[];
  type: number;
}

export type PreparedBlock = {
  data: BlockData;
  transactions: TransactionData[];
}
