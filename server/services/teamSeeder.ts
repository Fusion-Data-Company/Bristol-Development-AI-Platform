import { db } from '../db';
import { teamUsers, type InsertTeamUser } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Generic company team members for white-label platform
const teamData: InsertTeamUser[] = [
  // Leadership
  {
    name: 'John Smith',
    email: 'john.smith@yourcompany.com',
    role: 'CEO',
    department: 'Executive',
    accessLevel: 'admin',
    isActive: true
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@yourcompany.com',
    role: 'President',
    department: 'Executive',
    accessLevel: 'admin',
    isActive: true
  },
  {
    name: 'Michael Davis',
    email: 'michael.davis@yourcompany.com',
    role: 'Executive Vice President',
    department: 'Executive',
    accessLevel: 'admin',
    isActive: true
  },
  
  // Development Team
  {
    name: 'Jennifer Wilson',
    email: 'jennifer.wilson@yourcompany.com',
    role: 'Chief Development Officer',
    department: 'Development',
    accessLevel: 'full',
    isActive: true
  },
  {
    name: 'David Brown',
    email: 'david.brown@yourcompany.com',
    role: 'Vice President of Development',
    department: 'Development',
    accessLevel: 'full',
    isActive: true
  },
  {
    name: 'Robert Taylor',
    email: 'robert.taylor@yourcompany.com',
    role: 'Vice President of Development',
    department: 'Development',
    accessLevel: 'full',
    isActive: true
  },
  {
    name: 'Lisa Anderson',
    email: 'lisa.anderson@yourcompany.com',
    role: 'Vice President of Development',
    department: 'Development',
    accessLevel: 'full',
    isActive: true
  },
  {
    name: 'Thomas Martinez',
    email: 'thomas.martinez@yourcompany.com',
    role: 'Vice President of Development',
    department: 'Development',
    accessLevel: 'full',
    isActive: true
  },
  
  // Operations Team
  {
    name: 'Emily White',
    email: 'emily.white@yourcompany.com',
    role: 'Chief Operating Officer',
    department: 'Operations',
    accessLevel: 'admin',
    isActive: true
  },
  {
    name: 'Mark Thompson',
    email: 'mark.thompson@yourcompany.com',
    role: 'Executive Vice President of Operations',
    department: 'Operations',
    accessLevel: 'full',
    isActive: true
  },
  {
    name: 'Jessica Garcia',
    email: 'jessica.garcia@yourcompany.com',
    role: 'Executive Vice President of Property Management',
    department: 'Operations',
    accessLevel: 'full',
    isActive: true
  },
  {
    name: 'Christopher Lee',
    email: 'christopher.lee@yourcompany.com',
    role: 'Executive Vice President of Construction',
    department: 'Construction',
    accessLevel: 'full',
    isActive: true
  },
  
  // Finance Team
  {
    name: 'Amanda Clark',
    email: 'amanda.clark@yourcompany.com',
    role: 'Chief Financial Officer',
    department: 'Finance',
    accessLevel: 'admin',
    isActive: true
  },
  {
    name: 'Kevin Moore',
    email: 'kevin.moore@yourcompany.com',
    role: 'Vice President, Controller',
    department: 'Finance',
    accessLevel: 'full',
    isActive: true
  },
  {
    name: 'Rachel Adams',
    email: 'rachel.adams@yourcompany.com',
    role: 'Vice President of Finance',
    department: 'Finance',
    accessLevel: 'full',
    isActive: true
  },
  
  // Investment Team
  {
    name: 'Daniel Rodriguez',
    email: 'daniel.rodriguez@yourcompany.com',
    role: 'Chief Investment Officer',
    department: 'Investment',
    accessLevel: 'admin',
    isActive: true
  },
  {
    name: 'Nicole Turner',
    email: 'nicole.turner@yourcompany.com',
    role: 'Vice President of Investor Relations',
    department: 'Investment',
    accessLevel: 'full',
    isActive: true
  },
  
  // Additional Team Members
  {
    name: 'Andrew Phillips',
    email: 'andrew.phillips@yourcompany.com',
    role: 'Senior Vice President',
    department: 'Executive',
    accessLevel: 'full',
    isActive: true
  },
  {
    name: 'Stephanie Evans',
    email: 'stephanie.evans@yourcompany.com',
    role: 'Vice President of Human Resources',
    department: 'Human Resources',
    accessLevel: 'full',
    isActive: true
  },
  {
    name: 'Laura Mitchell',
    email: 'laura.mitchell@yourcompany.com',
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

export async function seedCompanyTeam() {
  try {
    console.log('🌱 Starting Company team seeding...');
    
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
    
    console.log(`✅ Company team seeding completed! Total members: ${teamData.length}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to seed Company team:', error);
    return false;
  }
}

// Export for initialization
export default seedCompanyTeam;