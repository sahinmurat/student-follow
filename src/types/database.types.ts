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
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string
                    role: 'admin' | 'student'
                    created_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name: string
                    role?: 'admin' | 'student'
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string
                    role?: 'admin' | 'student'
                    created_at?: string
                }
            }
            subject_weights: {
                Row: {
                    id: number
                    subject: string
                    weight: number
                    created_at: string
                }
                Insert: {
                    id?: number
                    subject: string
                    weight: number
                    created_at?: string
                }
                Update: {
                    id?: number
                    subject?: string
                    weight?: number
                    created_at?: string
                }
            }
            daily_entries: {
                Row: {
                    id: number
                    user_id: string
                    date: string
                    kk: number
                    rsl: number
                    prt: number
                    cvs: number
                    orc: number
                    thc: number
                    alm: number
                    trk: number
                    total_points: number
                    created_at: string
                }
                Insert: {
                    id?: number
                    user_id: string
                    date: string
                    kk?: number
                    rsl?: number
                    prt?: number
                    cvs?: number
                    orc?: number
                    thc?: number
                    alm?: number
                    trk?: number
                    total_points?: number
                    created_at?: string
                }
                Update: {
                    id?: number
                    user_id?: string
                    date?: string
                    kk?: number
                    rsl?: number
                    prt?: number
                    cvs?: number
                    orc?: number
                    thc?: number
                    alm?: number
                    trk?: number
                    total_points?: number
                    created_at?: string
                }
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
    }
}
