import "next-auth";

declare module "next-auth" {
  interface Session {
    teachHarbourToken?: string;
    teachHarbourRole?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    teachHarbourToken?: string;
    teachHarbourRole?: string;
  }
}
