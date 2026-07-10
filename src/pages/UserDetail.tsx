import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, BadgeCheck, Fingerprint, ShieldCheck, ScanFace, IdCard, ScrollText, Globe, Phone, Trash2 } from "lucide-react";
import { api, apiError, type IdpUserDetail } from "@/lib/api";
import { PageTransition } from "@/components/PageTransition";
import { Loader } from "@/components/Loader";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { initials, formatDate } from "@/lib/format";

const displayName = (u: IdpUserDetail) => u.full_name || u.username || (u.email ? u.email.split("@")[0] : "") || "Anonymous";

const tone = (s?: string) => {
  const k = (s || "").toLowerCase();
  if (["approved", "completed", "verified", "success", "passed"].includes(k)) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  if (["pending", "in_progress", "processing"].includes(k)) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
  if (["failed", "declined", "error", "rejected"].includes(k)) return "text-rose-400 bg-rose-500/10 border-rose-500/30";
  return "text-slate-400 bg-slate-500/10 border-slate-500/30";
};
const Pill = ({ s }: { s?: string }) => <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${tone(s)}`}>{s || "—"}</span>;

function Card({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-sky-400" /> {title}</div>
      {children}
    </div>
  );
}
const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2 text-sm last:border-0">
    <span className="text-muted-foreground">{k}</span>
    <span className="text-right font-medium">{v ?? "—"}</span>
  </div>
);

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["idp-user", id],
    queryFn: async () => (await api.get(`/admin/idp/users/${id}`)).data.user as IdpUserDetail,
  });

  const deleteMut = useMutation({
    mutationFn: async () => (await api.delete(`/admin/idp/users/${id}`)).data,
    onSuccess: () => {
      toast.success("Identity deleted");
      setConfirmOpen(false);
      qc.invalidateQueries({ queryKey: ["idp-users"] });
      qc.invalidateQueries({ queryKey: ["idp-overview"] });
      navigate("/users");
    },
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading) return <Loader />;
  if (!data) return <EmptyState icon={Fingerprint} title="User not found" description="This identity does not exist." />;

  const name = displayName(data);
  const ages = Object.entries(data.age_proofs ?? {}).filter(([, v]) => v).map(([k]) => k.replace("is_", "").replace("_plus", "+"));

  return (
    <PageTransition>
      <Link to="/users" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-lg font-semibold text-white">
          {initials(name)}
          {data.id_verified && (
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
              <BadgeCheck className="h-3 w-3 text-white" />
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{name}</h1>
          <p className="truncate text-sm text-muted-foreground">{data.email || "No email"}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {data.id_verified ? <Pill s="verified" /> : <Pill s="unverified" />}
          {data.reverify_required && <Pill s="reverify required" />}
          <button
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Identity" icon={ShieldCheck}>
          <Row k="Valyd ID" v={<span className="font-mono text-xs">{data.valyd_id || "—"}</span>} />
          <Row k="Country" v={data.country ? <span className="inline-flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{data.country}</span> : "—"} />
          <Row k="Phone" v={data.phone ? <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{data.phone}</span> : "—"} />
          <Row k="Joined" v={formatDate(data.created_at)} />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ages.length ? ages.map((a) => <span key={a} className="rounded-md bg-sky-500/10 px-2 py-0.5 text-xs text-sky-400">{a}</span>) : <span className="text-xs text-muted-foreground">No age proofs</span>}
          </div>
        </Card>

        <Card title="Pseudonyms (shared with relying parties)" icon={Fingerprint}>
          <Row k="Name" v={data.pseudonyms?.name || "—"} />
          <Row k="Username" v={data.pseudonyms?.username || "—"} />
          <Row k="Email" v={data.pseudonyms?.email || "—"} />
        </Card>

        <Card title={`KYC processes (${data.kyc_processes?.length ?? 0})`} icon={IdCard}>
          {data.kyc_processes?.length ? (
            <div className="space-y-2">
              {data.kyc_processes.map((k) => (
                <div key={k.id} className="rounded-lg border border-border/60 bg-background/40 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{k.ocr_doc_type || "document"} · {formatDate(k.created_at)}</span>
                    <Pill s={k.status} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <span className={`rounded border px-1.5 py-0.5 ${tone(k.face_status)}`}><ScanFace className="mr-1 inline h-3 w-3" />face {k.face_status || "—"}</span>
                    <span className={`rounded border px-1.5 py-0.5 ${tone(k.gov_status)}`}>gov {k.gov_status || "—"}</span>
                    <span className={`rounded border px-1.5 py-0.5 ${tone(k.zkp_status)}`}>zkp {k.zkp_status || "—"}</span>
                    {k.current_stage && <span className="rounded border border-slate-500/30 bg-slate-500/10 px-1.5 py-0.5 text-slate-400">stage: {k.current_stage}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No KYC processes.</p>}
        </Card>

        <Card title={`Verifications & licenses`} icon={ScrollText}>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Human checks ({data.human_verifications?.length ?? 0})</div>
          {data.human_verifications?.length ? (
            <div className="mb-4 space-y-1.5">
              {data.human_verifications.map((h) => (
                <div key={h.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{h.method || "check"} · {formatDate(h.created_at)}</span>
                  <Pill s={h.status} />
                </div>
              ))}
            </div>
          ) : <p className="mb-4 text-sm text-muted-foreground">No human verifications.</p>}

          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Licenses ({data.license_verifications?.length ?? 0})</div>
          {data.license_verifications?.length ? (
            <div className="space-y-1.5">
              {data.license_verifications.map((l) => (
                <div key={l.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{l.license_type || "license"}{l.external_ref ? ` · ${l.external_ref}` : ""}</span>
                  <Pill s={l.status} />
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No licenses.</p>}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this identity?"
        description={
          <>
            This deletes <span className="font-semibold text-foreground">{name}</span>'s Valyd account. They will no longer
            appear anywhere in the admin and their active sessions are revoked immediately. The underlying record and its
            KYC/biometric history are retained for audit and compliance.
          </>
        }
        confirmLabel="Delete identity"
        loading={deleteMut.isPending}
        onConfirm={() => deleteMut.mutate()}
        onCancel={() => setConfirmOpen(false)}
      />
    </PageTransition>
  );
}
