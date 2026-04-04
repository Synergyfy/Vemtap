export enum TriggerType {
  FIRST_MESSAGE = 'first_message',
  AFTER_FORM_SUBMIT = 'after_form_submit',
  AFTER_X_DAYS_INACTIVE = 'after_x_days_inactive',
  FIRST_TAG = 'first_tag',
  REPEAT_TAG = 'repeat_tag',
  REWARD_EARNED = 'reward_earned',
  SURVEY_COMPLETED = 'survey_completed',
  INACTIVE_CUSTOMER = 'inactive_customer',
  INBOUND_MESSAGE = 'inbound_message',
  OFF_HOURS = 'off_hours',
  WELCOME_MESSAGE = 'welcome_message',
}

export enum TargetType {
  NEW_VISITORS = 'new_visitors',
  RETURNING_CUSTOMERS = 'returning_customers',
  SPECIFIC_CATEGORY = 'specific_category',
}

export enum ActionType {
  SEND_SMS = 'send_sms',
  SEND_WHATSAPP = 'send_whatsapp',
  SEND_EMAIL = 'send_email',
  SEND_IN_APP_CHAT = 'send_in_app_chat',
  PUSH_REVIEW = 'push_review',
  SEND_IN_HOUSE = 'send_in_house',
}
