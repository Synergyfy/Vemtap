export enum TriggerType {
  FIRST_TAG = 'first_tag',
  REPEAT_TAG = 'repeat_tag',
  REWARD_EARNED = 'reward_earned',
  SURVEY_COMPLETED = 'survey_completed',
  INBOUND_MESSAGE = 'inbound_message',
  OFF_HOURS = 'off_hours',
  WELCOME_MESSAGE = 'welcome_message',
}

export enum ActionType {
  SEND_SMS = 'send_sms',
  SEND_WHATSAPP = 'send_whatsapp',
  SEND_EMAIL = 'send_email',
  PUSH_REVIEW = 'push_review',
  SEND_IN_HOUSE = 'send_in_house',
}
