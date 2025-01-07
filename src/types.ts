export interface AliSTTConfig {
  appKey: string;
  url: string;
  token: string;
  [key: string]: any;
}

export interface NlsConfig {
  url: string;
  appkey: string;
  token: string;
}

export interface StartParams {
  format: string;
  sample_rate: number;
  enable_intermediate_result: boolean;
  enable_punctuation_prediction: boolean;
  enable_inverse_text_normalization: boolean;
}

export interface AliSTTResponse<
  Payload extends Record<string, any> = Record<string, any>
> {
  header: {
    namespace: string;
    name: string;
    status: number;
    message_id: string;
    task_id: string;
    status_text: string;
  };
  payload: Payload;
}

export interface AliSTTChangedResponsePayload {
  index: number;
  time: number;
  result: string;
  confidence: number;
  words: Array<string>;
  status: number;
  fixed_result: string;
  unfixed_result: string;
}

export interface AliSTTBeginResponsePayload {
  index: number;
  time: number;
}

export interface AliSTTEndResponsePayload {
  index: number;
  time: number;
  result: string;
  confidence: number;
  words: Array<string>;
  status: number;
  gender: string;
  begin_time: number;
  fixed_result: string;
  unfixed_result: string;
  stash_result: {
    sentenceId: number;
    beginTime: number;
    text: string;
    fixedText: string;
    unfixedText: string;
    currentTime: number;
    words: Array<string>;
  };
  audio_extra_info: string;
  sentence_id: string;
  gender_score: number;
}

export interface AliSTTEventMap {
  started: [AliSTTResponse];
  begin: [AliSTTResponse<AliSTTBeginResponsePayload>];
  changed: [AliSTTResponse<AliSTTChangedResponsePayload>];
  end: [AliSTTResponse<AliSTTEndResponsePayload>];
  failed: [AliSTTResponse];
  completed: [AliSTTResponse];
  closed: [];
}
