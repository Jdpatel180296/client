import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PastMeetingsPage from "../pages/PastMeetingsPage";

// Mock apiFetch to return fixture meetings
jest.mock("../utils/api", () => ({
  apiFetch: jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: "m1",
            summary: "Quarterly Strategy Call",
            start: new Date("2025-11-10T15:00:00Z").toISOString(),
            end: new Date("2025-11-10T16:00:00Z").toISOString(),
            platform: "zoom",
            platform_link: "https://zoom.us/j/1234567890",
            attendees: [
              { email: "ceo@example.com" },
              { email: "cto@example.com" },
              { email: "pm@example.com" },
            ],
            has_transcript: true,
          },
        ]),
    })
  ),
}));

describe("PastMeetingsPage", () => {
  it("renders meeting card with summary, date, platform icon and attendees", async () => {
    render(
      <MemoryRouter>
        <PastMeetingsPage />
      </MemoryRouter>
    );

    // Summary
    expect(
      await screen.findByText(/Quarterly Strategy Call/)
    ).toBeInTheDocument();
    // Platform icon (🟦 for zoom)
    expect(screen.getByText("🟦")).toBeInTheDocument();
    // Attendees label
    expect(
      screen.getByText(
        /Attendees \(3\): ceo@example.com, cto@example.com, pm@example.com/
      )
    ).toBeInTheDocument();
    // Transcript pill
    expect(screen.getByText(/Transcript/)).toBeInTheDocument();
  });
});
