import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Profile from "../pages/profile";

jest.mock("../lib/spotify", () => ({
  fetchProfile: jest.fn(),
  fetchTopTracks: jest.fn(),
  fetchTopArtists: jest.fn(),
  getWithExpiry: jest.fn(),
  redirectToAuthCodeFlow: jest.fn(),
}));

const mockProfile = {
  display_name: "Test User",
  images: [{ url: "https://testurl.com/profile.jpg" }],
};
const mockTopTracks = [
  { id: "1", name: "Test Track 1", album: { name: "Test Album 1", images: [{ url: "https://testurl.com/album1.jpg" }] }, artists: [{ name: "Test Artist 1" }] },
  { id: "2", name: "Test Track 2", album: { name: "Test Album 2", images: [{ url: "https://testurl.com/album2.jpg" }] }, artists: [{ name: "Test Artist 2" }] },
];
const mockTopArtists = [
  { id: "1", name: "Test Artist 1", images: [{ url: "https://testurl.com/artist1.jpg" }] },
  { id: "2", name: "Test Artist 2", images: [{ url: "https://testurl.com/artist2.jpg" }] },
];

describe("Profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders nothing when data is not loaded", () => {
    render(<Profile />);
    expect(screen.queryByText("Spotify Profile")).toBeNull();
  });
});
