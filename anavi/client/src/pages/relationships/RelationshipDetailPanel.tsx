import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  ShieldCheck,
  Mail,
  Phone,
  Linkedin,
  Users,
  Loader2,
  Save,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { COLORS } from "./constants";

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: "#6B7A90" }}>{label}</span>
      <span className="font-medium" style={{ color: COLORS.navy }}>
        {value}
      </span>
    </div>
  );
}

export function ContactIcon({ platform }: { platform: string }) {
  const cls = "w-4 h-4";
  const style = { color: COLORS.blue };
  switch (platform) {
    case "email":
      return <Mail className={cls} style={style} />;
    case "phone":
      return <Phone className={cls} style={style} />;
    case "linkedin":
      return <Linkedin className={cls} style={style} />;
    default:
      return <Users className={cls} style={style} />;
  }
}

export function RelationshipDetailPanel({
  relationshipId,
  onClose,
}: {
  relationshipId: number;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const { data: rel, isLoading } = trpc.relationship.get.useQuery(
    { id: relationshipId },
    { enabled: !!relationshipId }
  );

  const { data: contacts, refetch: refetchContacts } =
    trpc.contact.getByRelationship.useQuery(
      { relationshipId },
      { enabled: !!relationshipId }
    );

  const [editNotes, setEditNotes] = useState("");
  const [editStrength, setEditStrength] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [contactForm, setContactForm] = useState({
    displayName: "",
    platform: "email" as string,
    handle: "",
  });
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    if (rel) {
      setEditNotes(rel.notes || "");
      setEditStrength(rel.strength || "moderate");
      setNotesDirty(false);
    }
  }, [rel]);

  const updateMutation = trpc.relationship.update.useMutation({
    onSuccess: () => {
      toast.success("Relationship updated");
      utils.relationship.get.invalidate({ id: relationshipId });
      utils.relationship.list.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const grantConsentMutation = trpc.relationship.grantConsent.useMutation({
    onSuccess: () => {
      toast.success("Consent granted — relationship is now fully visible");
      utils.relationship.get.invalidate({ id: relationshipId });
      utils.relationship.list.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const addContactMutation = trpc.contact.add.useMutation({
    onSuccess: () => {
      toast.success("Contact added");
      refetchContacts();
      setContactForm({ displayName: "", platform: "email", handle: "" });
      setShowContactForm(false);
    },
    onError: e => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <Loader2
          className="w-6 h-6 animate-spin"
          style={{ color: COLORS.blue }}
        />
      </div>
    );
  }

  if (!rel) {
    return (
      <p className="py-8 text-center text-muted-foreground text-sm">
        Relationship not found
      </p>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <SheetHeader>
        <SheetTitle className="text-lg" style={{ color: COLORS.navy }}>
          REL-{rel.id}
        </SheetTitle>
        <SheetDescription>
          {(rel.relationshipType || "direct").charAt(0).toUpperCase() +
            (rel.relationshipType || "direct").slice(1)}{" "}
          relationship
        </SheetDescription>
      </SheetHeader>

      {/* Metadata */}
      <section className="space-y-3">
        <DetailRow
          label="Type"
          value={
            (rel.relationshipType || "direct").charAt(0).toUpperCase() +
            (rel.relationshipType || "direct").slice(1)
          }
        />
        <DetailRow
          label="Status"
          value={rel.isBlind ? "Custodied (Blind)" : "Open"}
        />
        <DetailRow
          label="Custody Timestamp"
          value={new Date(rel.createdAt).toLocaleString()}
        />
        <DetailRow
          label="Established"
          value={
            rel.establishedAt
              ? new Date(rel.establishedAt).toLocaleDateString()
              : "—"
          }
        />
        {rel.tags && rel.tags.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: "#6B7A90" }}>Tags</span>
            <div className="flex gap-1 flex-wrap justify-end">
              {rel.tags.map((t: string) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{ background: `${COLORS.blue}10`, color: COLORS.blue }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Grant Consent */}
      {rel.isBlind && (
        <button
          onClick={() => grantConsentMutation.mutate({ id: relationshipId })}
          disabled={grantConsentMutation.isPending}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
          style={{ background: COLORS.green }}
        >
          {grantConsentMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Granting...
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" /> Grant Consent
            </>
          )}
        </button>
      )}

      {/* Inline Editing: Strength */}
      <section>
        <label
          className="block text-xs font-semibold mb-1.5"
          style={{ color: COLORS.navy }}
        >
          Strength
        </label>
        <select
          value={editStrength}
          onChange={e => {
            setEditStrength(e.target.value);
            updateMutation.mutate({
              id: relationshipId,
              strength: e.target.value as any,
            });
          }}
          className="w-full h-9 px-3 rounded-lg border text-sm"
          style={{ borderColor: COLORS.border, color: COLORS.navy }}
        >
          <option value="weak">Weak</option>
          <option value="moderate">Moderate</option>
          <option value="strong">Strong</option>
          <option value="very_strong">Very Strong</option>
        </select>
      </section>

      {/* Inline Editing: Notes */}
      <section>
        <label
          className="block text-xs font-semibold mb-1.5"
          style={{ color: COLORS.navy }}
        >
          Notes
        </label>
        <textarea
          value={editNotes}
          onChange={e => {
            setEditNotes(e.target.value);
            setNotesDirty(true);
          }}
          className="w-full rounded-lg border p-3 text-sm resize-none focus:outline-none focus:ring-2"
          style={{ borderColor: COLORS.border, minHeight: 80 }}
          placeholder="Add notes..."
        />
        {notesDirty && (
          <button
            onClick={() => {
              updateMutation.mutate({ id: relationshipId, notes: editNotes });
              setNotesDirty(false);
            }}
            disabled={updateMutation.isPending}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: COLORS.blue }}
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            Save Notes
          </button>
        )}
      </section>

      {/* Contacts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold" style={{ color: COLORS.navy }}>
            Contacts
          </h4>
          <button
            onClick={() => setShowContactForm(!showContactForm)}
            className="inline-flex items-center gap-1 text-xs font-semibold"
            style={{ color: COLORS.blue }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        {contacts && contacts.length > 0 ? (
          <div className="space-y-2">
            {contacts.map((c: any) => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-2.5 rounded-lg"
                style={{ background: COLORS.surface }}
              >
                <ContactIcon platform={c.platform} />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: COLORS.navy }}
                  >
                    {c.displayName || c.handle}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.platform} · {c.handle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No contacts linked yet.
          </p>
        )}

        {showContactForm && (
          <div
            className="mt-3 p-3 rounded-lg border space-y-2.5"
            style={{ borderColor: COLORS.border }}
          >
            <input
              type="text"
              placeholder="Display name"
              value={contactForm.displayName}
              onChange={e =>
                setContactForm({ ...contactForm, displayName: e.target.value })
              }
              className="w-full h-8 px-3 rounded border text-sm"
              style={{ borderColor: COLORS.border }}
            />
            <select
              value={contactForm.platform}
              onChange={e =>
                setContactForm({ ...contactForm, platform: e.target.value })
              }
              className="w-full h-8 px-3 rounded border text-sm"
              style={{ borderColor: COLORS.border, color: COLORS.navy }}
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="linkedin">LinkedIn</option>
              <option value="telegram">Telegram</option>
              <option value="discord">Discord</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="twitter">Twitter</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Handle / value"
              value={contactForm.handle}
              onChange={e =>
                setContactForm({ ...contactForm, handle: e.target.value })
              }
              className="w-full h-8 px-3 rounded border text-sm"
              style={{ borderColor: COLORS.border }}
            />
            <button
              onClick={() => {
                if (!contactForm.handle) {
                  toast.error("Handle is required");
                  return;
                }
                addContactMutation.mutate({
                  platform: contactForm.platform as any,
                  handle: contactForm.handle,
                  displayName: contactForm.displayName || undefined,
                });
              }}
              disabled={addContactMutation.isPending}
              className="w-full h-8 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: COLORS.gold }}
            >
              {addContactMutation.isPending ? "Adding..." : "Add Contact"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}