from youtube_transcript_api import YouTubeTranscriptApi
try:
    v_id = "g9sbgzEv3mg"
    api = YouTubeTranscriptApi()
    print(f"Listing for {v_id} using instance...")
    ts = api.list(v_id)
    print(f"Success: {ts}")
    t = ts.find_transcript(['en'])
    data = t.fetch()
    print(f"Fetched {len(data)} chunks.")
except Exception as e:
    import traceback
    traceback.print_exc()
