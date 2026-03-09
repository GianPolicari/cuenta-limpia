export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
    public: {
        Tables: {
            transactions: {
                Row: {
                    id: string
                    amount: number
                    transaction_date: string
                    description: string | null
                    category: string | null
                    transaction_type: string | null
                    card_id: string | null
                    user_id: string
                }
                Insert: {
                    id?: string
                    amount: number
                    transaction_date: string
                    description?: string | null
                    category?: string | null
                    transaction_type?: string | null
                    card_id?: string | null
                    user_id?: string
                }
                Update: {
                    id?: string
                    amount?: number
                    transaction_date?: string
                    description?: string | null
                    category?: string | null
                    transaction_type?: string | null
                    card_id?: string | null
                    user_id?: string
                }
                Relationships: []
            }

            cards: {
                Row: {
                    id: string
                    name: string
                    card_type: string
                    color: string | null
                    user_id: string
                }
                Insert: {
                    id?: string
                    name: string
                    card_type: string
                    color?: string | null
                    user_id?: string
                }
                Update: {
                    id?: string
                    name?: string
                    card_type?: string
                    color?: string | null
                    user_id?: string
                }
                Relationships: []
            }

            custom_categories: {
                Row: {
                    id: string
                    name: string
                    type: string
                    user_id: string
                }
                Insert: {
                    id?: string
                    name: string
                    type: string
                    user_id?: string
                }
                Update: {
                    id?: string
                    name?: string
                    type?: string
                    user_id?: string
                }
                Relationships: []
            }

        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
