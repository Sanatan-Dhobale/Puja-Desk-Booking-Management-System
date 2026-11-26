export function currency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value, options = {}) {
  return new Date(value.slice(0, 10) + "T00:00:00").toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...options,
    },
  );
}

export function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
}

export function bookingReference(booking) {
  return booking.reference || "PB-" + booking._id.slice(-6).toUpperCase();
}

export function exportBookings(bookings) {
  const rows = [
    [
      "Booking",
      "Devotee",
      "Email",
      "Phone",
      "Puja",
      "Date",
      "Amount (INR)",
      "Status",
    ],
    ...bookings.map((booking) => [
      bookingReference(booking),
      booking.devotee.name,
      booking.devotee.email || "",
      booking.devotee.phone,
      booking.pujaName,
      booking.date.slice(0, 10),
      booking.amount,
      booking.status,
    ]),
  ];
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          let value = String(cell);
          // Keep spreadsheet applications from interpreting user text as formulas.
          if (/^[=+@\-\t\r]/.test(value)) value = "'" + value;
          return '"' + value.replaceAll('"', '""') + '"';
        })
        .join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "pujadesk-bookings.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
