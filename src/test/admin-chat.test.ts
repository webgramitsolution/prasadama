import { beforeEach, describe, expect, it, vi } from "vitest";

const { from, select, order, inUsers } = vi.hoisted(() => ({
  from: vi.fn(), select: vi.fn(), order: vi.fn(), inUsers: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from } }));
import { loadAdminConversations } from "@/lib/admin-chat";

describe("Admin customer chat loading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    from.mockReturnValue({ select });
    select.mockReturnValue({ order, in: inUsers });
  });

  it("loads the existing customer chat and joins by user_id rather than profile id", async () => {
    order.mockResolvedValue({ data: [{ id: "chat-1", buyer_id: "customer-1" }], error: null });
    inUsers.mockResolvedValue({ data: [{ user_id: "customer-1", full_name: "Customer" }], error: null });
    const chats = await loadAdminConversations();
    expect(chats).toEqual([{ id: "chat-1", buyer_id: "customer-1", buyer_profile: { user_id: "customer-1", full_name: "Customer" } }]);
    expect(select.mock.calls[0]).toEqual(["*"]);
    expect(inUsers).toHaveBeenCalledWith("user_id", ["customer-1"]);
  });

  it("keeps customer chats visible when a customer has no profile", async () => {
    order.mockResolvedValue({ data: [{ id: "chat-1", buyer_id: "customer-1" }], error: null });
    inUsers.mockResolvedValue({ data: [], error: null });
    expect(await loadAdminConversations()).toEqual([{ id: "chat-1", buyer_id: "customer-1", buyer_profile: null }]);
  });

  it("does not fetch profiles for an empty chat list", async () => {
    order.mockResolvedValue({ data: [], error: null });
    expect(await loadAdminConversations()).toEqual([]);
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("reports an actual conversation read failure", async () => {
    order.mockResolvedValue({ data: null, error: { message: "permission denied" } });
    await expect(loadAdminConversations()).rejects.toEqual({ message: "permission denied" });
  });

  it("does not silently hide profile permission errors", async () => {
    order.mockResolvedValue({ data: [{ buyer_id: "customer-1" }], error: null });
    inUsers.mockResolvedValue({ data: null, error: { message: "permission denied" } });
    await expect(loadAdminConversations()).rejects.toEqual({ message: "permission denied" });
  });
});