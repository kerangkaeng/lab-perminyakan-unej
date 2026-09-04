export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  const token = getSessionToken();

  if (!session || !token) {
    return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  }

  // Sama seperti PATCH: pengecekan role di sini cuma untuk pesan error yang
  // jelas, enforcement sesungguhnya ada di RLS (requests_delete_admin_only).
  if (session.appRole !== "admin") {
    return NextResponse.json({ error: "Hanya admin yang bisa melakukan aksi ini." }, { status: 403 });
  }

  const supabase = supabaseAuthed(token);
  const { error } = await supabase
    .from("practicum_requests")
    .delete()
    .eq("id", params.id);

  if (error) {
    console.error("Delete practicum_request error", error);
    return NextResponse.json({ error: "Gagal menghapus pengajuan." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
