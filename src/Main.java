
import java.util.ArrayList;
import java.util.Scanner;

class Professional {

    String nic, name, skill, contact;

    Professional(String nic, String name, String skill, String contact) {
        this.nic = nic;
        this.name = name;
        this.skill = skill;
        this.contact = contact;
    }
}

public class Main {

    static ArrayList<Professional> registry = new ArrayList<>();
    static Scanner sc = new Scanner(System.in);

    // Function 1: Register a new professional
    static void registerProfessional() {
        System.out.print("Enter NIC Number (10 or 12 characters): ");
        String nic = sc.nextLine();

        // NIC format check (9 digits + V/X or 12 digits)
        boolean valid = false;
        if (nic.length() == 10) {
            char lastChar = nic.charAt(9);
            if (lastChar == 'V' || lastChar == 'v' || lastChar == 'X' || lastChar == 'x') {
                valid = true;
            }
        } else if (nic.length() == 12) {
            valid = true;
        }

        if (!valid) {
            System.out.println("Error: Invalid NIC! Use 9 digits + V/X or 12 digits.");
            return;
        }

        // Check if NIC already exists
        for (int i = 0; i < registry.size(); i++) {
            if (registry.get(i).nic.equalsIgnoreCase(nic)) {
                System.out.println("Error: This NIC is already registered!");
                return;
            }
        }

        System.out.print("Enter Name: ");
        String name = sc.nextLine();
        System.out.print("Enter Skill: ");
        String skill = sc.nextLine();
        System.out.print("Enter Contact: ");
        String contact = sc.nextLine();

        if (nic.isEmpty() || name.isEmpty() || skill.isEmpty() || contact.isEmpty()) {
            System.out.println("Error: All fields are required!");
        } else {
            registry.add(new Professional(nic, name, skill, contact));
            System.out.println("Successfully Registered!");
        }
    }

    // Function 2: Search
    static void searchBySkill() {
        System.out.print("Enter Skill to search: ");
        String searchSkill = sc.nextLine();
        boolean found = false;

        System.out.println("\n--- Search Results ---");
        for (int i = 0; i < registry.size(); i++) {
            Professional p = registry.get(i);
            if (p.skill.equalsIgnoreCase(searchSkill)) {
                System.out.println("NIC: " + p.nic + " | Name: " + p.name + " | Contact: " + p.contact);
                found = true;
            }
        }
        if (!found) {
            System.out.println("No one found with that skill.");
        }
    }

    // Function 3: Update
    static void updateProfessional() {
        System.out.print("Enter your NIC Number: ");
        String nic = sc.nextLine();
        boolean updated = false;

        for (int i = 0; i < registry.size(); i++) {
            Professional p = registry.get(i);
            if (p.nic.equalsIgnoreCase(nic)) {
                System.out.print("Enter New Contact Number: ");
                p.contact = sc.nextLine();
                System.out.println("Contact updated successfully!");
                updated = true;
                break;
            }
        }
        if (!updated) {
            System.out.println("NIC not found.");
        }
    }

    // Function 4: Display
    static void displayAll() {
        if (registry.isEmpty()) {
            System.out.println("No professionals registered yet.");
            return;
        }

        System.out.println("\n--- Registered Professionals ---");
        for (int i = 0; i < registry.size(); i++) {
            Professional p = registry.get(i);
            System.out.println((i + 1) + ". NIC: " + p.nic + " | Name: " + p.name + " | Skill: " + p.skill + " | Contact: " + p.contact);
        }
    }

    // Function 5: Delete
    static void deleteProfessional() {
        System.out.print("Enter the NIC Number of the professional to delete: ");
        String nic = sc.nextLine();
        boolean removed = false;

        for (int i = 0; i < registry.size(); i++) {
            if (registry.get(i).nic.equalsIgnoreCase(nic)) {
                registry.remove(i);
                System.out.println("Professional removed successfully!");
                removed = true;
                break;
            }
        }
        if (!removed) {
            System.out.println("NIC not found in registry.");
        }
    }

    public static void main(String[] args) {
        int choice = 0;

        while (choice != 6) {
            System.out.println("\n--- Local Community Skill-Share Registry ---");
            System.out.println("1. Register Professional");
            System.out.println("2. Search by Skill");
            System.out.println("3. Update Contact");
            System.out.println("4. Display All");
            System.out.println("5. Delete Entry");
            System.out.println("6. Exit");
            System.out.print("Enter your choice: ");

            choice = sc.nextInt();
            sc.nextLine();

            if (choice == 1) {
                registerProfessional();
            } else if (choice == 2) {
                searchBySkill();
            } else if (choice == 3) {
                updateProfessional();
            } else if (choice == 4) {
                displayAll();
            } else if (choice == 5) {
                deleteProfessional();
            } else if (choice == 6) {
                System.out.println("Thank you! Exiting...");
            } else {
                System.out.println("Invalid choice! Please select 1-6.");
            }
        }
    }
}
