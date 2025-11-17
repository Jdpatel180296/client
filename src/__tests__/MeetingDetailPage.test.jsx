import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import MeetingDetailPage from "../pages/MeetingDetailPage";

// Mock apiFetch
const mockMeeting = {
  id: "m1",
  summary: "Quarterly Review",
  start: new Date("2025-11-10T15:00:00Z").toISOString(),
  platform: "zoom",
  transcript: "Meeting transcript text goes here.",
};

const mockPosts = [
  {
    id: "p1",
    platform: "linkedin",
    content: "Post content here.",
    status: "draft",
  },
];

const mockApiFetchCalls = [];

jest.mock("../utils/api", () => ({
  apiFetch: jest.fn((path, options) => {
    mockApiFetchCalls.push({ path, options });
    if (path === "/api/meetings/m1") {
      return Promise.resolve({
        json: () => Promise.resolve(mockMeeting),
      });
    }
    if (path === "/api/meetings/m1/posts") {
      return Promise.resolve({
        json: () => Promise.resolve(mockPosts),
      });
    }
    if (path === "/api/automations") {
      return Promise.resolve({
        json: () => Promise.resolve([]),
      });
    }
    if (path === "/api/generate-post") {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            id: "p2",
            platform: "linkedin",
            content: "Generated post.",
            status: "draft",
          }),
      });
    }
    if (path === "/api/posts/p1/publish") {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            post: { ...mockPosts[0], status: "published" },
          }),
      });
    }
    return Promise.reject(new Error("Unknown path"));
  }),
}));

beforeEach(() => {
  mockApiFetchCalls.length = 0;
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn(() => Promise.resolve()),
    },
  });
});

describe("MeetingDetailPage", () => {
  it("renders meeting title with platform icon, transcript, and Copy button", async () => {
    render(
      <MemoryRouter initialEntries={["/meetings/m1"]}>
        <Routes>
          <Route path="/meetings/:id" element={<MeetingDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for meeting title
    expect(await screen.findByText(/Quarterly Review/)).toBeInTheDocument();
    // Platform icon (🟦 for zoom)
    expect(screen.getByText("🟦")).toBeInTheDocument();
    // Transcript
    expect(
      screen.getByText(/Meeting transcript text goes here/)
    ).toBeInTheDocument();
    // Copy button for post
    const copyBtn = screen.getByRole("button", {
      name: /Copy post content for linkedin/i,
    });
    expect(copyBtn).toBeInTheDocument();
  });

  it("calls clipboard API when Copy button is clicked", async () => {
    render(
      <MemoryRouter initialEntries={["/meetings/m1"]}>
        <Routes>
          <Route path="/meetings/:id" element={<MeetingDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    const copyBtn = await screen.findByRole("button", {
      name: /Copy post content for linkedin/i,
    });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "Post content here."
      );
    });
    // Button text should change to "Copied!"
    expect(copyBtn.textContent).toBe("Copied!");
  });

  it("publishes post and updates status when Publish button is clicked", async () => {
    render(
      <MemoryRouter initialEntries={["/meetings/m1"]}>
        <Routes>
          <Route path="/meetings/:id" element={<MeetingDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    const publishBtn = await screen.findByRole("button", {
      name: /Publish post to linkedin/i,
    });
    fireEvent.click(publishBtn);

    await waitFor(() => {
      const publishCall = mockApiFetchCalls.find(
        (c) => c.path === "/api/posts/p1/publish"
      );
      expect(publishCall).toBeDefined();
    });
  });
});
