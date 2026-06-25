import argparse

import docs
import transform

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", choices=["cloud", "cache"], default="cloud",
                        help="cloud: 从 Supabase 重新拉取(默认); cache: 复用上次 .cache")
    parser.add_argument("--templates", type=str, default="templates")
    parser.add_argument("--resources", type=str, default="resources")
    parser.add_argument("--output", type=str, default="output")
    args = parser.parse_args()

    print("[INFO] Step 1/2: Deriving records from Supabase...")
    records, image_links = transform.get_records(args.source)

    print("\n[INFO] Step 2/2: Building mkdocs pages...")
    docs.build_pages(records, image_links, args.templates, args.resources, args.output)

    print("\n[SUCCESS] Job completed successfully, ready to publish!")
