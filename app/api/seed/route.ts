import { NextResponse } from "next/server";

import { seedRolesAndUsers, seedSampleProducts } from "@/lib/seed";

export async function POST() {
  try {
    await seedRolesAndUsers();
    await seedSampleProducts();

    return NextResponse.json({
      success: true,
      message: "Seed data created successfully.",
    });
  } catch (error) {
    console.error("Seed failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Seed data failed.",
      },
      { status: 500 }
    );
  }
}
