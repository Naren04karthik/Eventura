import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAnalyticsData } from "@/services/analytics.service";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const analyticsResult = await getAnalyticsData();

    if (!analyticsResult.success) {
      return NextResponse.json(analyticsResult, { status: 500 });
    }

    const data = analyticsResult.data;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ["Analytics Summary", ""],
      ["Total Users", data.summary.totalUsers],
      ["Total Events", data.summary.totalEvents],
      ["Total Registrations", data.summary.totalRegistrations],
      ["Total Colleges", data.summary.totalColleges],
      ["Generated At", new Date().toLocaleString()],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Users by Role
    const usersByRoleData = [["Role", "Count"]];
    data.usersByRole.forEach((item: any) => {
      usersByRoleData.push([item.role, item._count.id]);
    });
    const usersByRoleWs = XLSX.utils.aoa_to_sheet(usersByRoleData);
    XLSX.utils.book_append_sheet(wb, usersByRoleWs, "Users by Role");

    // Users by Status
    const usersByStatusData = [["Status", "Count"]];
    data.usersByStatus.forEach((item: any) => {
      usersByStatusData.push([item.status, item._count.id]);
    });
    const usersByStatusWs = XLSX.utils.aoa_to_sheet(usersByStatusData);
    XLSX.utils.book_append_sheet(wb, usersByStatusWs, "Users by Status");

    // Events by Status
    const eventsByStatusData = [["Status", "Count"]];
    data.eventsByStatus.forEach((item: any) => {
      eventsByStatusData.push([item.status || "N/A", item._count.id]);
    });
    const eventsByStatusWs = XLSX.utils.aoa_to_sheet(eventsByStatusData);
    XLSX.utils.book_append_sheet(wb, eventsByStatusWs, "Events by Status");

    // Registrations by Status
    const regByStatusData = [["Status", "Count"]];
    data.registrationsByStatus.forEach((item: any) => {
      regByStatusData.push([item.status, item._count.id]);
    });
    const regByStatusWs = XLSX.utils.aoa_to_sheet(regByStatusData);
    XLSX.utils.book_append_sheet(wb, regByStatusWs, "Registrations by Status");

    // Top Events
    const topEventsData = [["Event Title", "Date", "Registration Count"]];
    data.topEvents.forEach((item: any) => {
      topEventsData.push([
        item.title,
        new Date(item.date).toLocaleDateString(),
        item.registrationCount,
      ]);
    });
    const topEventsWs = XLSX.utils.aoa_to_sheet(topEventsData);
    XLSX.utils.book_append_sheet(wb, topEventsWs, "Top Events");

    // Recent Registrations
    const recentRegData = [["User Name", "Email", "Event", "Status", "Registered At"]];
    data.recentRegistrations.forEach((item: any) => {
      recentRegData.push([
        item.userName,
        item.userEmail,
        item.eventTitle,
        item.status,
        new Date(item.registeredAt).toLocaleString(),
      ]);
    });
    const recentRegWs = XLSX.utils.aoa_to_sheet(recentRegData);
    XLSX.utils.book_append_sheet(wb, recentRegWs, "Recent Registrations");

    // Generate buffer
    const buf = XLSX.writeFile(wb, "analytics.xlsx", { type: "buffer" });

    // This only works in Node.js, return proper Excel file
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Disposition": `attachment; filename="eventura-analytics-${new Date().toISOString().split("T")[0]}.xlsx"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Export analytics error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to export analytics" },
      { status: 500 }
    );
  }
}
