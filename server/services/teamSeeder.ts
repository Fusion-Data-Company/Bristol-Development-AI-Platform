import { db } from '../db';
import { teamUsers, type InsertTeamUser } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Bristol team members from https://www.bristoldevelopment.com/bristol-team
const teamData: InsertTeamUser[] = [
  // Leadership
  {
    name: 'Scott Koontz',
    email: 'scott@bristoldevelopment.com',
    role: 'CEO',
    department: 'Executive',
    accessLevel: 'admin',
    isActive: true
  },
  {
    name: 'Greg Grissom',
    email: 'greg@bristoldevelopment.com',
    role: 'President',
    department: 'Executive',
    accessLevel: 'admin',
    isActive: true
  },
  {
    name: 'Charlie Tinsley',
    email: 'charlie@bristoldevelopment.com',
    role: 'Executive Vice President',
    department: 'Executive',
    accessLevel: 'admin',
    isActive: true
  },
  
  // Development Team
  {
    name: 'Nathan Whittacre',
    email: 'nathan@bristoldevelopment.com',
    role: 'Chief Development Officer',
    department: 'Development',
    accessLevel: 'full',
    isActive: true
  },
  {
    name: 'Russell Groves',
    email: 'russell@bristoldevelopment.com',
    role: 'Vice President of Development',
    department: 'Development',
    accessLevel: 'full',
    isActive: true
  },
  {
    name: 'Reece Parker',
    email: 'reece@bristoldevelopment.com',
    role: 'Vice President of Development',
    department: 'Development',
    accessLevel: 'full',
    isActive: true
  },
  {
    name: 'Mike Lassiter',
    email: 'mike@bristoldevelopment.com',
    role: 'Vice President of Development',
    department: 'Development',
    accessLevel: 'full',
    isActive: true
  },
  {
    name: 'David Ross',
    email: 'david@bristoldevelopment.com',
    role: 'Vice President of Development',
    department: 'Development',
    accessLevel: 'full',
    isActive: true
  },
  
  // Operations Team
  {
    name: 'Bill Boyd',
    email: 'bill@bristoldevelopment.com',
    role: 'Chief Operating Officer',
    department: 'Operations',
    accessLevel: 'admin',
    isActive: true
  },
  {
    name: 'Lance London',
    email: 'lance@bristoldevelopment.com',
    role: 'Executive Vice President of Operations',
    department: 'Operations',
    accessLevel: 'full',
    isActive: true
  },
  {
    name: 'Amy Leach',
    email: 'amy@bristoldevelopment.com',
    role: 'Executive Vice President of Property Management',
    department: 'Operations',
    accessLevel: 'full',
    isActive: true
  },
  {
    name: 'Tim Dowdy',
    email: 'tim@bristoldevelopment.com',
    role: 'Executive Vice President of Construction',
    department: 'Construction',
    accessLevel: 'full',
    isActive: true
  },
  
  // Finance Team
  {
    name: 'James Currie',
    email: 'james@bristoldevelopment.com',
    role: 'Chief Financial Officer',
    department: 'Finance',
    accessLevel: 'admin',
    isActive: true
  },
  {
    name: 'Eric Farmer',
    email: 'eric@bristoldevelopment.com',
    role: 'Vice President, Controller',
    department: 'Finance',
    accessLevel: 'full',
    isActive: true
  },
  {
    name: 'Christine Taylor',
    email: 'christine@bristoldevelopment.com',
    role: 'Vice President of Finance',
    department: 'Finance',
    accessLevel: 'full',
    isActive: true
  },
  
  // Investment Team
  {
    name: 'Nick Davis',
    email: 'nick@bristoldevelopment.com',
    role: 'Chief Investment Officer',
    department: 'Investment',
    accessLevel: 'admin',
    isActive: true
  },
  {
    name: 'Margo Weathers',
    email: 'margo@bristoldevelopment.com',
    role: 'Vice President of Investor Relations',
    department: 'Investment',
    accessLevel: 'full',
    isActive: true
  },
  
  // Additional Team Members
  {
    name: 'Kim Nichols',
    email: 'kim@bristoldevelopment.com',
    role: 'Senior Vice President',
    department: 'Executive',
    accessLevel: 'full',
    isActive: true
  },
  {
    name: 'Tanya Hamilton',
    email: 'tanya@bristoldevelopment.com',
    role: 'Vice President of Human Resources',
    department: 'Human Resources',
    accessLevel: 'full',
    isActive: true
  },
  {
    name: 'Amanda Durett',
    email: 'amanda@bristoldevelopment.com',
    role: 'Marketing Manager',
    department: 'Marketing',
    accessLevel: 'standard',
    isActive: true
  },
  
  // Special Access - Developer and Guest
  {
    name: 'Rob Yeager',
    email: 'rob@fusiondata.co',
    role: 'Developer / Admin',
    department: 'Technology',
    accessLevel: 'admin',
    isActive: true
  },
  {
    name: 'Jason Perez',
    email: 'jason@theinsuranceschool.com',
    role: 'Guest / Full Access',
    department: 'External',
    accessLevel: 'full',
    isActive: true
  }
];

export async function seedBristolTeam() {
  try {
    console.log('🌱 Starting Bristol team seeding...');
    
    for (const member of teamData) {
      // Check if member already exists
      const existing = await db.select()
        .from(teamUsers)
        .where(eq(teamUsers.email, member.email!))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(teamUsers).values(member);
        console.log(`✅ Added: ${member.name} (${member.role})`);
      } else {
        // Update existing member
        await db.update(teamUsers)
          .set({
            name: member.name,
            role: member.role,
            department: member.department,
            accessLevel: member.accessLevel,
            isActive: member.isActive,
            updatedAt: new Date()
          })
          .where(eq(teamUsers.email, member.email!));
        console.log(`📝 Updated: ${member.name}`);
      }
    }
    
    console.log(`✅ Bristol team seeding completed! Total members: ${teamData.length}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to seed Bristol team:', error);
    return false;
  }
}

// Export for initialization
export default seedBristolTeam;