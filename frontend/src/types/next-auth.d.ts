import "next-auth";

declare module "next-auth" {
  interface Session {
    tutorflowToken?: string;
    tutorflowRole?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tutorflowToken?: string;
    tutorflowRole?: string;
  }
}
