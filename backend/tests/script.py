import paramiko
import time
import sys
import re
import tkinter as tk
from tkinter import filedialog
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

ssh_clients = []
thread_local = threading.local()
def ssh_connect(host, username, password):
    """Establish an SSH connection to the host."""
    try:
        ssh_client = paramiko.SSHClient()
        ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh_client.connect(host, username=username, password=password)
        return ssh_client
    except Exception as e:
        print(f"SSH connection failed: {e}")
        return None
def get_ssh_client(host, username, password):
    """Get or create an SSH client for the current thread."""
    if not hasattr(thread_local, "ssh_client"):
        ssh_client = ssh_connect(host, username, password)
        if ssh_client:
            thread_local.ssh_client = ssh_client
            ssh_clients.append(ssh_client)
    return thread_local.ssh_client
def list_usb_volumes(ssh_client):
    """List available USB volumes and let the user select one."""
    stdin, stdout, stderr = ssh_client.exec_command("ls /volumeUSB*/usbshare")
    output = stdout.read().decode()
    usb_volumes = output.split()
    if not usb_volumes:
        print("No USB volumes found.")
        sys.exit(1)
    print("Available USB volumes:")
    for i, volume in enumerate(usb_volumes, 1):
        print(f"{i}. {volume}")
    choice = int(input("Select a USB volume (number): "))
    return usb_volumes[choice - 1].split('/usbshare')[0]
def open_file_dialog():
    """Open a file dialog to select the file list."""
    root = tk.Tk()
    root.withdraw()
    file_path = filedialog.askopenfilename(title="Select file list", filetypes=[("Text files", "*.txt")])
    root.destroy()
    if not file_path:
        print("No file selected. Exiting.")
        sys.exit(1)
    return file_path
def read_file_list(file_path):
    """Read the list of files from the specified file."""
    try:
        with open(file_path, 'r') as f:
            return [line.strip() for line in f if line.strip()]
    except Exception as e:
        print(f"Error reading file list: {e}")
        sys.exit(1)
def copy_file(host, username, password, source, dest):
    """Copy a single file using its own SSH client."""
    ssh_client = get_ssh_client(host, username, password)
    if ssh_client:
        command = f'echo {password} | sudo -S cp "{source}" "{dest}"'
        stdin, stdout, stderr = ssh_client.exec_command(command)
        exit_status = stdout.channel.recv_exit_status()
        if exit_status != 0:
            error_output = stderr.read().decode()
            print(f"Error copying {source}: {error_output}")
        else:
            print(f"Copied {source} to {dest}")
def copy_files_from_list(ssh_client, file_list, dest_path, host, username, password):
    """Copy files from the list to the destination path in parallel."""
    print("Setting full permissions for the USB volume...")
    ssh_client.exec_command("sudo chmod -R 777 /volumeUSB1/")
    time.sleep(1)  # Wait for the command to complete

print("Checking which files need to be copied...")
files_to_copy = []
for file in file_list:
    source_path = f"/volume1/ls-resources/prod/bundled-epub/{file}"
    dest_file_path = f"{dest_path}/usbshare/{file}"

    # Check if destination file exists and get its size
    check_command = f'ls -l "{dest_file_path}"'
    stdin, stdout, stderr = ssh_client.exec_command(check_command)
    output = stdout.read().decode()
    existing_size = None
    match = re.search(r'\s(\d+)\s+.*' + re.escape(file), output)
    if match:
        existing_size = int(match.group(1))

    # Get source file size
    size_command = f'stat -c "%s" "{source_path}"'
    stdin, stdout, stderr = ssh_client.exec_command(size_command)
    source_size = int(stdout.read().decode().strip())

    if existing_size is None or existing_size != source_size:
        files_to_copy.append(file)

print(f"Need to copy {len(files_to_copy)} files.")
if files_to_copy:
    print("Copying files in parallel...")
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = []
        for file in files_to_copy:
            source_path = f"/volume1/ls-resources/prod/bundled-epub/{file}"
            dest_file_path = f"{dest_path}/usbshare/{file}"
            futures.append(executor.submit(copy_file, host, username, password, source_path, dest_file_path))
        for future in as_completed(futures):
            future.result()  # Ensure all futures complete and catch exceptions
print("File copy operation completed.")

def main():
    # Gather user input for NAS IP and credentials
    host = input("Enter the NAS IP address: ")
    username = "admin"  # Replace with your username
    password = "vLwpV6wUXF9qGKGw"  # Replace with your password

# Establish main SSH connection
ssh_client = ssh_connect(host, username, password)
if ssh_client is None:
    print("Connection failed. Exiting.")
    sys.exit(1)

try:
    # List available USBs and select one
    selected_usb = list_usb_volumes(ssh_client)

    # Open file dialog to select file list
    file_list_path = open_file_dialog()

    # Read file list
    file_list = read_file_list(file_list_path)

    # Copy files from list to USB in parallel
    copy_files_from_list(ssh_client, file_list, selected_usb, host, username, password)

finally:
    # Close all SSH clients
    for client in ssh_clients:
        client.close()
    ssh_client.close()

if name == "main":
    main()

