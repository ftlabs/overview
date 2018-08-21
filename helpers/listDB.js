const lists = {
  "uk-homepage-top-stories": "520ddb76-e43d-11e4-9e89-00144feab7de",
  "uk-homepage-opinion": "bc81b5bc-1995-11e5-a130-2e7db721f996",
  "uk-homepage-highlights": "73667f46-1a55-11e5-a130-2e7db721f996",
  "international-homepage-top-stories": "b0d8e4fe-10ff-11e5-8413-00144feabdc0",
  "international-homepage-opinion": "cd4a2e0a-91f9-11e6-a72e-b428cb934b78",
  "international-homepage-highlights": "cd36f40c-91f9-11e6-a72e-b428cb934b78",
  "world-top-stories": "bf3045bc-2402-11e6-aa98-db1e01fabc0c",
  "uk-top-stories": "fd07f488-2999-11e6-8ba3-cdd781d02d89",
  "companies-top-stories": "8efc3a0c-2995-11e6-8ba3-cdd781d02d89",
  "markets-top-stories": "a6f97fc0-28be-11e6-8ba3-cdd781d02d89",
  "opinion-top-stories": "596090b2-2997-11e6-8ba3-cdd781d02d89",
  "work-careers-top-stories": "5bfe91e8-2997-11e6-8ba3-cdd781d02d89",
  "life-and-arts-top-stories": "e9a67094-2995-11e6-8ba3-cdd781d02d89",
  "us-top-stories": "feeba5b0-2999-11e6-8ba3-cdd781d02d89",
  "personal-finance-top-stories": "bfc530ea-2999-11e6-8ba3-cdd781d02d89",
  "special-reports-top-stories": "c9cdfd1c-1f5f-11e7-a454-ab04428977f9",
  "markets-opinion-and-analysis": "a6d02684-28be-11e6-8ba3-cdd781d02d89",
  "companies-opinion-and-Analysis": "8ee1d7c0-2995-11e6-8ba3-cdd781d02d89",
  "us-opinion-and-analysis": "fec2c83e-2999-11e6-8ba3-cdd781d02d89",
  "uk-opinion-and-analysis": "fcddccd0-2999-11e6-8ba3-cdd781d02d89",
  "uk-recommended-features": "fcf16b82-2999-11e6-8ba3-cdd781d02d89",
  "us-recommended": "fed76a32-2999-11e6-8ba3-cdd781d02d89",
  "companies-related-topics": "8f1358ea-2995-11e6-8ba3-cdd781d02d89",
  "markets-related-topics": "a6e46ca2-28be-11e6-8ba3-cdd781d02d89",
  "opinion-recommended": "594df556-2997-11e6-8ba3-cdd781d02d89",
  "work-and-career-recommended": "5beb8166-2997-11e6-8ba3-cdd781d02d89",
  "uk-regional-news": "01469f60-7515-11e6-b60a-de4532d5ea35",
  "life-and-arts": "2584310e-6ab0-11e6-ae5b-a7cc5dd5a28c"
};

function getId(sectionName) {
  return lists[sectionName];
}

module.exports = { getId };
