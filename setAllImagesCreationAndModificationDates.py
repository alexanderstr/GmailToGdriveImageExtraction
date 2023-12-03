import os
import time
from datetime import datetime

def set_file_dates(root_folder):
    for root, dirs, files in os.walk(root_folder):
        for file in files:
            try:
                # Extract date from file name
                date_str = file[:10]
                file_date = datetime.strptime(date_str, '%Y-%m-%d')

                # Convert datetime to time format
                mod_time = time.mktime(file_date.timetuple())

                # Full path to the file
                full_path = os.path.join(root, file)

                # Set both creation and modification times
                os.utime(full_path, (mod_time, mod_time))
            except Exception as e:
                print(f"Error processing file {file}: {e}")

# Replace '/path/to/your/folder' with the path to your folder
set_file_dates('!PhotoDump')
