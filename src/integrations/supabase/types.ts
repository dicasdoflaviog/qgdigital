export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_memories: {
        Row: {
          created_at: string
          gabinete_id: string
          id: string
          message_count: number | null
          period_end: string | null
          period_start: string | null
          summary: string
          topics: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          gabinete_id: string
          id?: string
          message_count?: number | null
          period_end?: string | null
          period_start?: string | null
          summary: string
          topics?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          gabinete_id?: string
          id?: string
          message_count?: number | null
          period_end?: string | null
          period_start?: string | null
          summary?: string
          topics?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      assessores: {
        Row: {
          avatar: string | null
          cadastros: number
          created_at: string
          id: string
          nome: string
          user_id: string | null
        }
        Insert: {
          avatar?: string | null
          cadastros?: number
          created_at?: string
          id?: string
          nome: string
          user_id?: string | null
        }
        Update: {
          avatar?: string | null
          cadastros?: number
          created_at?: string
          id?: string
          nome?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          acao: string | null
          action: string
          created_at: string
          details: Json | null
          gabinete_nome: string | null
          id: string
          ip_address: string | null
          role_level: number | null
          user_id: string
          usuario_nome: string | null
        }
        Insert: {
          acao?: string | null
          action: string
          created_at?: string
          details?: Json | null
          gabinete_nome?: string | null
          id?: string
          ip_address?: string | null
          role_level?: number | null
          user_id: string
          usuario_nome?: string | null
        }
        Update: {
          acao?: string | null
          action?: string
          created_at?: string
          details?: Json | null
          gabinete_nome?: string | null
          id?: string
          ip_address?: string | null
          role_level?: number | null
          user_id?: string
          usuario_nome?: string | null
        }
        Relationships: []
      }
      backup_exclusoes: {
        Row: {
          dados_originais: Json | null
          excluido_em: string | null
          excluido_por: string | null
          id: string
          tabela_origem: string
        }
        Insert: {
          dados_originais?: Json | null
          excluido_em?: string | null
          excluido_por?: string | null
          id?: string
          tabela_origem?: string
        }
        Update: {
          dados_originais?: Json | null
          excluido_em?: string | null
          excluido_por?: string | null
          id?: string
          tabela_origem?: string
        }
        Relationships: []
      }
      billing_history: {
        Row: {
          cliente_id: string
          created_at: string | null
          id: string
          mes_referencia: string
          qtd_gabinetes: number
          valor_total: number
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          id?: string
          mes_referencia: string
          qtd_gabinetes?: number
          valor_total?: number
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          id?: string
          mes_referencia?: string
          qtd_gabinetes?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_history_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_history_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "resumo_gabinetes_por_cidade"
            referencedColumns: ["gabinete_id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      config_faturamento: {
        Row: {
          bloqueado: boolean | null
          cliente_id: string | null
          data_ultimo_pagamento: string | null
          dia_vencimento: number | null
          estados_autorizados: string[] | null
          habilidades: Json | null
          id: string
          status_pagamento: string | null
          updated_at: string | null
          valor_por_gabinete: number | null
        }
        Insert: {
          bloqueado?: boolean | null
          cliente_id?: string | null
          data_ultimo_pagamento?: string | null
          dia_vencimento?: number | null
          estados_autorizados?: string[] | null
          habilidades?: Json | null
          id?: string
          status_pagamento?: string | null
          updated_at?: string | null
          valor_por_gabinete?: number | null
        }
        Update: {
          bloqueado?: boolean | null
          cliente_id?: string | null
          data_ultimo_pagamento?: string | null
          dia_vencimento?: number | null
          estados_autorizados?: string[] | null
          habilidades?: Json | null
          id?: string
          status_pagamento?: string | null
          updated_at?: string | null
          valor_por_gabinete?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "config_faturamento_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_faturamento_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "resumo_gabinetes_por_cidade"
            referencedColumns: ["gabinete_id"]
          },
        ]
      }
      contatos_estrategicos: {
        Row: {
          bairro_atuacao: string | null
          cargo_funcao: string | null
          categoria: string
          created_at: string
          created_by: string | null
          id: string
          instituicao: string | null
          nome: string
          observacao: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          bairro_atuacao?: string | null
          cargo_funcao?: string | null
          categoria?: string
          created_at?: string
          created_by?: string | null
          id?: string
          instituicao?: string | null
          nome: string
          observacao?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          bairro_atuacao?: string | null
          cargo_funcao?: string | null
          categoria?: string
          created_at?: string
          created_by?: string | null
          id?: string
          instituicao?: string | null
          nome?: string
          observacao?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      contratos_nacional: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          escopo_geografico: string | null
          estados_autorizados: string[] | null
          id: string
          limite_gabinetes: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          escopo_geografico?: string | null
          estados_autorizados?: string[] | null
          id?: string
          limite_gabinetes?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          escopo_geografico?: string | null
          estados_autorizados?: string[] | null
          id?: string
          limite_gabinetes?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_nacional_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_nacional_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resumo_gabinetes_por_cidade"
            referencedColumns: ["gabinete_id"]
          },
        ]
      }
      convites: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          email: string
          gabinete_id: string | null
          id: string
          role_level: number
          token: string | null
          utilizado: boolean | null
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          email: string
          gabinete_id?: string | null
          id?: string
          role_level?: number
          token?: string | null
          utilizado?: boolean | null
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          email?: string
          gabinete_id?: string | null
          id?: string
          role_level?: number
          token?: string | null
          utilizado?: boolean | null
        }
        Relationships: []
      }
      demandas: {
        Row: {
          assessor_id: string | null
          bairro: string | null
          categoria: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          eleitor_id: string | null
          excluido: boolean | null
          gabinete_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          prioridade: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assessor_id?: string | null
          bairro?: string | null
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          eleitor_id?: string | null
          excluido?: boolean | null
          gabinete_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          prioridade?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assessor_id?: string | null
          bairro?: string | null
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          eleitor_id?: string | null
          excluido?: boolean | null
          gabinete_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          prioridade?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demandas_assessor_id_fkey"
            columns: ["assessor_id"]
            isOneToOne: false
            referencedRelation: "assessores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_eleitor_id_fkey"
            columns: ["eleitor_id"]
            isOneToOne: false
            referencedRelation: "eleitores"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_legislativos: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string | null
          gabinete_id: string
          id: string
          link_arquivo: string | null
          numero_protocolo: string | null
          status: string
          tipo: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          gabinete_id: string
          id?: string
          link_arquivo?: string | null
          numero_protocolo?: string | null
          status?: string
          tipo?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          gabinete_id?: string
          id?: string
          link_arquivo?: string | null
          numero_protocolo?: string | null
          status?: string
          tipo?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      eleitores: {
        Row: {
          assessor_id: string | null
          bairro: string
          cidade: string | null
          created_at: string
          data_nascimento: string | null
          estado: string | null
          excluido: boolean | null
          gabinete_id: string | null
          id: string
          image_urls: Json | null
          is_leader: boolean
          latitude: number | null
          longitude: number | null
          nome: string
          sexo: string | null
          situacao: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          assessor_id?: string | null
          bairro?: string
          cidade?: string | null
          created_at?: string
          data_nascimento?: string | null
          estado?: string | null
          excluido?: boolean | null
          gabinete_id?: string | null
          id?: string
          image_urls?: Json | null
          is_leader?: boolean
          latitude?: number | null
          longitude?: number | null
          nome: string
          sexo?: string | null
          situacao?: string
          updated_at?: string
          whatsapp?: string
        }
        Update: {
          assessor_id?: string | null
          bairro?: string
          cidade?: string | null
          created_at?: string
          data_nascimento?: string | null
          estado?: string | null
          excluido?: boolean | null
          gabinete_id?: string | null
          id?: string
          image_urls?: Json | null
          is_leader?: boolean
          latitude?: number | null
          longitude?: number | null
          nome?: string
          sexo?: string | null
          situacao?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "eleitores_assessor_id_fkey"
            columns: ["assessor_id"]
            isOneToOne: false
            referencedRelation: "assessores"
            referencedColumns: ["id"]
          },
        ]
      }
      emendas: {
        Row: {
          ano_exercicio: number | null
          created_at: string
          created_by: string | null
          descricao: string | null
          destino_instituicao_id: string | null
          gabinete_id: string
          id: string
          localizacao_gps: string | null
          status: string
          titulo: string
          updated_at: string
          valor: number | null
        }
        Insert: {
          ano_exercicio?: number | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          destino_instituicao_id?: string | null
          gabinete_id: string
          id?: string
          localizacao_gps?: string | null
          status?: string
          titulo: string
          updated_at?: string
          valor?: number | null
        }
        Update: {
          ano_exercicio?: number | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          destino_instituicao_id?: string | null
          gabinete_id?: string
          id?: string
          localizacao_gps?: string | null
          status?: string
          titulo?: string
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "emendas_destino_instituicao_id_fkey"
            columns: ["destino_instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          context: string | null
          created_at: string
          details: Json | null
          id: string
          message: string
          user_id: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          message: string
          user_id?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          message?: string
          user_id?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          cliente_id: string
          enabled: boolean | null
          feature_key: string
          id: string
          updated_at: string | null
        }
        Insert: {
          cliente_id: string
          enabled?: boolean | null
          feature_key: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string
          enabled?: boolean | null
          feature_key?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_flags_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "resumo_gabinetes_por_cidade"
            referencedColumns: ["gabinete_id"]
          },
        ]
      }
      feedbacks: {
        Row: {
          content: string
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      gabinete_cache_resumo: {
        Row: {
          created_at: string
          expires_at: string
          gabinete_id: string
          generated_at: string
          id: string
          resumo_json: Json
        }
        Insert: {
          created_at?: string
          expires_at?: string
          gabinete_id: string
          generated_at?: string
          id?: string
          resumo_json?: Json
        }
        Update: {
          created_at?: string
          expires_at?: string
          gabinete_id?: string
          generated_at?: string
          id?: string
          resumo_json?: Json
        }
        Relationships: []
      }
      gabinete_config: {
        Row: {
          cidade_estado: string | null
          cor_primaria: string | null
          created_at: string
          endereco_sede: string | null
          foto_oficial_url: string | null
          gabinete_id: string
          ia_linguagem: string | null
          ia_nome: string | null
          ia_perfil: string | null
          ia_rigor: string | null
          id: string
          logo_url: string | null
          nome_mandato: string | null
          telefone_contato: string | null
          updated_at: string
        }
        Insert: {
          cidade_estado?: string | null
          cor_primaria?: string | null
          created_at?: string
          endereco_sede?: string | null
          foto_oficial_url?: string | null
          gabinete_id: string
          ia_linguagem?: string | null
          ia_nome?: string | null
          ia_perfil?: string | null
          ia_rigor?: string | null
          id?: string
          logo_url?: string | null
          nome_mandato?: string | null
          telefone_contato?: string | null
          updated_at?: string
        }
        Update: {
          cidade_estado?: string | null
          cor_primaria?: string | null
          created_at?: string
          endereco_sede?: string | null
          foto_oficial_url?: string | null
          gabinete_id?: string
          ia_linguagem?: string | null
          ia_nome?: string | null
          ia_perfil?: string | null
          ia_rigor?: string | null
          id?: string
          logo_url?: string | null
          nome_mandato?: string | null
          telefone_contato?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gabinete_config_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gabinete_config_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: true
            referencedRelation: "resumo_gabinetes_por_cidade"
            referencedColumns: ["gabinete_id"]
          },
        ]
      }
      global_config: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      grupos_politicos: {
        Row: {
          created_at: string | null
          id: string
          lider_id: string | null
          nome: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lider_id?: string | null
          nome: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lider_id?: string | null
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupos_politicos_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupos_politicos_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "resumo_gabinetes_por_cidade"
            referencedColumns: ["gabinete_id"]
          },
        ]
      }
      instituicoes: {
        Row: {
          bairro: string | null
          cnpj: string | null
          created_at: string
          created_by: string | null
          endereco: string | null
          gabinete_id: string
          historico_apoio: string | null
          id: string
          nome: string
          responsavel_contato: string | null
          responsavel_nome: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          endereco?: string | null
          gabinete_id: string
          historico_apoio?: string | null
          id?: string
          nome: string
          responsavel_contato?: string | null
          responsavel_nome?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          endereco?: string | null
          gabinete_id?: string
          historico_apoio?: string | null
          id?: string
          nome?: string
          responsavel_contato?: string | null
          responsavel_nome?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      municipios_foco: {
        Row: {
          created_at: string | null
          estado: string
          id: string
          latitude: number
          longitude: number
          nome: string
          zoom_ideal: number | null
        }
        Insert: {
          created_at?: string | null
          estado: string
          id?: string
          latitude: number
          longitude: number
          nome: string
          zoom_ideal?: number | null
        }
        Update: {
          created_at?: string | null
          estado?: string
          id?: string
          latitude?: number
          longitude?: number
          nome?: string
          zoom_ideal?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          endereco: string | null
          estado_atuacao: string | null
          first_login: boolean
          full_name: string
          gabinete_id: string | null
          id: string
          is_active: boolean
          last_sign_in: string | null
          regiao_atuacao: string | null
          telefone: string | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          endereco?: string | null
          estado_atuacao?: string | null
          first_login?: boolean
          full_name?: string
          gabinete_id?: string | null
          id: string
          is_active?: boolean
          last_sign_in?: string | null
          regiao_atuacao?: string | null
          telefone?: string | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          endereco?: string | null
          estado_atuacao?: string | null
          first_login?: boolean
          full_name?: string
          gabinete_id?: string | null
          id?: string
          is_active?: boolean
          last_sign_in?: string | null
          regiao_atuacao?: string | null
          telefone?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      skills_matrix: {
        Row: {
          enabled: boolean
          feature_key: string
          id: string
          role_level: number
          updated_at: string | null
        }
        Insert: {
          enabled?: boolean
          feature_key: string
          id?: string
          role_level: number
          updated_at?: string | null
        }
        Update: {
          enabled?: boolean
          feature_key?: string
          id?: string
          role_level?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          gabinete_id: string
          id: string
          is_manual_trial: boolean
          plan_type: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          gabinete_id: string
          id?: string
          is_manual_trial?: boolean
          plan_type?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          gabinete_id?: string
          id?: string
          is_manual_trial?: boolean
          plan_type?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: true
            referencedRelation: "resumo_gabinetes_por_cidade"
            referencedColumns: ["gabinete_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          role_level: number
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          role_level?: number
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          role_level?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      resumo_gabinetes_por_cidade: {
        Row: {
          cidade: string | null
          demandas_pendentes: number | null
          demandas_resolvidas: number | null
          gabinete_id: string | null
          nome_vereador: string | null
          total_demandas: number | null
          total_eleitores: number | null
        }
        Relationships: []
      }
      view_inteligencia_global: {
        Row: {
          gabinete_id: string | null
          total_eleitores: number | null
          total_lideres: number | null
          ultima_atividade: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_admin_global_stats: { Args: never; Returns: Json }
      get_gabinete_stats: { Args: { v_gabinete_id: string }; Returns: Json }
      get_user_gabinete_id: { Args: never; Returns: string }
      get_user_role_level: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      notify_all_users: {
        Args: {
          _message: string
          _metadata?: Json
          _title: string
          _type?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "assessor" | "lider_politico" | "secretaria" | "super_admin"
      subscription_plan: "bronze" | "silver" | "gold"
      subscription_status: "active" | "past_due" | "canceled" | "trialing"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "assessor", "lider_politico", "secretaria", "super_admin"],
      subscription_plan: ["bronze", "silver", "gold"],
      subscription_status: ["active", "past_due", "canceled", "trialing"],
    },
  },
} as const
