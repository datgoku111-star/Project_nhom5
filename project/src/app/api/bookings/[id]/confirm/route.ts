import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceOrderId = searchParams.get("serviceOrderId");
    const bookingId = params.id;

    // 1. Confirm room/experience booking
    const { data: booking, error: bError } = await supabaseServer
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (!bError && booking) {
      if (user.role !== "ADMIN" && user.role !== "RECEPTIONIST") {
        return NextResponse.json({ error: "Forbidden. Only staff can confirm bookings." }, { status: 403 });
      }

      // Update booking status to CONFIRMED
      await supabaseServer
        .from("bookings")
        .update({ status: "CONFIRMED", updated_at: new Date().toISOString() })
        .eq("id", bookingId);

      // Check if this is an experience booking
      let isExp = false;
      let expMeta: any = null;
      if (booking.special_requests) {
        try {
          expMeta = JSON.parse(booking.special_requests);
          if (expMeta && expMeta.isExperience) {
            isExp = true;
          }
        } catch (e) {}
      }

      if (isExp) {
        // Find room stay booking to link to
        let stayBookingId = expMeta?.room_stay_booking_id;
        
        if (!stayBookingId && booking.user_id) {
          // Fallback: Query for active checked in stay
          const { data: activeStay } = await supabaseServer
            .from("bookings")
            .select("id")
            .eq("user_id", booking.user_id)
            .eq("status", "CHECKED_IN")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (activeStay) {
            stayBookingId = activeStay.id;
          } else {
            // Fallback: Query for confirmed stay
            const { data: confirmedStay } = await supabaseServer
              .from("bookings")
              .select("id")
              .eq("user_id", booking.user_id)
              .eq("status", "CONFIRMED")
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (confirmedStay) {
              stayBookingId = confirmedStay.id;
            }
          }
        }

        if (stayBookingId) {
          // Find experience ID from db
          const { data: dbExp } = await supabaseServer
            .from("experiences")
            .select("id")
            .ilike("title", `%${expMeta?.title || ""}%`)
            .limit(1)
            .maybeSingle();

          let experienceId = dbExp?.id;
          if (!experienceId) {
            const { data: firstExp } = await supabaseServer
              .from("experiences")
              .select("id")
              .limit(1)
              .maybeSingle();
            experienceId = firstExp?.id;
          }

          if (experienceId) {
            // Insert into experience_bookings
            await supabaseServer
              .from("experience_bookings")
              .insert({
                booking_id: stayBookingId,
                experience_id: experienceId,
                guests: booking.num_guests || 1,
                total_price: booking.total_amount,
                notes: `Linked from Experience Booking #${booking.id}`
              });

            // Insert payment for the room stay invoice (representing the 10% experience deposit)
            await supabaseServer
              .from("payments")
              .insert({
                booking_id: stayBookingId,
                amount: booking.total_amount * 0.1,
                method: "TRANSFER",
                status: "COMPLETED",
                transaction_ref: `EXP_DEP_${booking.id.split("-")[0].toUpperCase()}`
              });
          }
        }

        // Also insert payment for the experience booking itself
        const { data: existingPayment } = await supabaseServer
          .from("payments")
          .select("*")
          .eq("booking_id", bookingId)
          .eq("status", "COMPLETED");

        if (!existingPayment || existingPayment.length === 0) {
          await supabaseServer
            .from("payments")
            .insert({
              booking_id: bookingId,
              amount: booking.total_amount * 0.1,
              method: "TRANSFER",
              status: "COMPLETED",
              transaction_ref: `EXP_OWN_DEP_${booking.id.split("-")[0].toUpperCase()}`
            });
        }
      } else {
        // Standard Room booking confirm payment flow
        const { data: existingPayment } = await supabaseServer
          .from("payments")
          .select("*")
          .eq("booking_id", bookingId)
          .eq("status", "COMPLETED");

        if (!existingPayment || existingPayment.length === 0) {
          await supabaseServer
            .from("payments")
            .insert({
              booking_id: bookingId,
              amount: booking.total_amount * 0.1, // Only 10% deposit is paid when confirming
              method: "TRANSFER",
              status: "COMPLETED",
              transaction_ref: `CONFIRM_FALLBACK_${Math.floor(100000 + Math.random() * 900000)}`
            });
        }
      }
    }

    // 2. Confirm food service order
    if (serviceOrderId) {
      const { data: order } = await supabaseServer
        .from("service_orders")
        .select("*")
        .eq("id", serviceOrderId)
        .single();

      if (order) {
        // Update service order status to IN_PROGRESS
        await supabaseServer
          .from("service_orders")
          .update({ status: "IN_PROGRESS" })
          .eq("id", serviceOrderId);

        // Record service order payment
        const { data: existingOrderPayment } = await supabaseServer
          .from("payments")
          .select("*")
          .eq("booking_id", bookingId)
          .like("transaction_ref", `%service_${serviceOrderId}%`);

        if (!existingOrderPayment || existingOrderPayment.length === 0) {
          await supabaseServer
            .from("payments")
            .insert({
              booking_id: bookingId,
              amount: order.total_amount,
              method: "TRANSFER",
              status: "COMPLETED",
              transaction_ref: `SERVICE_CONFIRM_${serviceOrderId}`
            });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Confirmation endpoint error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
