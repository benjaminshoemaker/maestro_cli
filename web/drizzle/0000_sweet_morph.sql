CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"phase" integer NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb,
	"generated_doc" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_project_id_phase_unique" UNIQUE("project_id","phase"),
	CONSTRAINT "conversations_phase_check" CHECK ("conversations"."phase" between 1 and 4)
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"current_phase" integer DEFAULT 1,
	"phase_1_complete" boolean DEFAULT false NOT NULL,
	"phase_2_complete" boolean DEFAULT false NOT NULL,
	"phase_3_complete" boolean DEFAULT false NOT NULL,
	"phase_4_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_session_token_unique" UNIQUE("session_token"),
	CONSTRAINT "projects_user_id_name_unique" UNIQUE("user_id","name"),
	CONSTRAINT "projects_current_phase_check" CHECK ("projects"."current_phase" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_id" varchar(255) NOT NULL,
	"github_username" varchar(255) NOT NULL,
	"email" varchar(255),
	"stripe_customer_id" varchar(255),
	"subscription_status" varchar(50) DEFAULT 'none' NOT NULL,
	"subscription_plan" varchar(50),
	"free_project_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_github_id_unique" UNIQUE("github_id"),
	CONSTRAINT "users_subscription_status_check" CHECK ("users"."subscription_status" in ('none', 'active', 'canceled', 'past_due')),
	CONSTRAINT "users_subscription_plan_check" CHECK (("users"."subscription_plan" in ('monthly', 'annual') or "users"."subscription_plan" is null))
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_conversations_project_id" ON "conversations" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_projects_user_id" ON "projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_projects_session_token" ON "projects" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "idx_users_github_id" ON "users" USING btree ("github_id");--> statement-breakpoint
CREATE INDEX "idx_users_stripe_customer_id" ON "users" USING btree ("stripe_customer_id");