create extension if not exists "pgcrypto";

create table if not exists bc_wooboost_sites (
  id uuid primary key default gen_random_uuid(),
  site_id varchar(64) not null unique,
  site_name varchar(160) not null,
  site_url varchar(255) not null unique,
  admin_email varchar(191) not null,
  mode varchar(32) not null default 'credits',
  plugin_version varchar(32) not null,
  token_hash varchar(64) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bc_wooboost_site_credits (
  id uuid primary key default gen_random_uuid(),
  site_ref uuid not null unique references bc_wooboost_sites(id) on delete cascade,
  monthly_cycle varchar(7) not null,
  monthly_free_total integer not null default 25,
  monthly_free_used integer not null default 0,
  paid_credits integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bc_wooboost_ai_request_logs (
  id uuid primary key default gen_random_uuid(),
  request_id varchar(64) not null,
  site_id varchar(64) not null,
  feature varchar(64) not null,
  mode varchar(32) not null,
  status varchar(32) not null,
  credit_spent boolean not null default false,
  provider_response_id varchar(128),
  error_message text,
  request_payload jsonb not null,
  response_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bc_wooboost_ai_logs_request_id_idx
  on bc_wooboost_ai_request_logs(request_id);

create index if not exists bc_wooboost_ai_logs_site_id_idx
  on bc_wooboost_ai_request_logs(site_id);

create index if not exists bc_wooboost_ai_logs_status_idx
  on bc_wooboost_ai_request_logs(status);
