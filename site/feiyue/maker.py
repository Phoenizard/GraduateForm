import argparse

import docs
import transform

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--templates", type=str, default="templates")
    parser.add_argument("--resources", type=str, default="resources")
    parser.add_argument("--output", type=str, default="output")
    args = parser.parse_args()

    print("[INFO] Step 1/2: Loading frozen records...")
    records = transform.get_records()

    print("\n[INFO] Step 2/2: Building mkdocs pages...")
    docs.build_pages(records, args.templates, args.resources, args.output)

    print("\n[SUCCESS] Job completed successfully, ready to publish!")
