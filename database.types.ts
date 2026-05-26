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
                    total_cuotas: number | null
                    cuota_actual: number | null
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
                    total_cuotas?: number | null
                    cuota_actual?: number | null
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
                    total_cuotas?: number | null
                    cuota_actual?: number | null
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

            budgets: {
                Row: {
                    id: string
                    user_id: string
                    category_name: string
                    monthly_amount: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    category_name: string
                    monthly_amount: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    category_name?: string
                    monthly_amount?: number
                    created_at?: string
                }
                Relationships: []
            }

            recurring_transactions: {
                Row: {
                    id: string
                    user_id: string
                    description: string
                    amount: number
                    category: string | null
                    transaction_type: string
                    card_id: string | null
                    day_of_month: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    description: string
                    amount: number
                    category?: string | null
                    transaction_type: string
                    card_id?: string | null
                    day_of_month: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    description?: string
                    amount?: number
                    category?: string | null
                    transaction_type?: string
                    card_id?: string | null
                    day_of_month?: number
                    is_active?: boolean
                    created_at?: string
                }
                Relationships: []
            }

            recurring_applied: {
                Row: {
                    id: string
                    user_id: string
                    recurring_id: string
                    applied_month: number
                    applied_year: number
                    transaction_id: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string
                    recurring_id: string
                    applied_month: number
                    applied_year: number
                    transaction_id?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    recurring_id?: string
                    applied_month?: number
                    applied_year?: number
                    transaction_id?: string | null
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
