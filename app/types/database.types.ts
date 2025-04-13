export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any
    }
    Views: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any
    }
    Functions: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any
    }
    Enums: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any
    }
  }
}
