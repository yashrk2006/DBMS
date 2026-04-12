import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Link,
} from '@react-email/components';
import * as React from 'react';

interface StatusUpdateEmailProps {
  studentName: string;
  internshipTitle: string;
  newStatus: string;
}

export const StatusUpdateEmail = ({
  studentName,
  internshipTitle,
  newStatus,
}: StatusUpdateEmailProps) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted': return '#22c55e';
      case 'rejected': return '#ef4444';
      case 'interviewing': return '#3b82f6';
      default: return '#ea580c';
    }
  };

  return (
    <Html>
      <Head />
      <Preview>Your application status for {internshipTitle} has been updated.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>SKILLSYNC</Text>
          </Section>
          
          <Heading style={h1}>Application Update</Heading>
          
          <Text style={text}>
            Hi {studentName},
          </Text>
          
          <Section style={contentSection}>
            <Text style={text}>
              There has been a change in your application status for <strong>{internshipTitle}</strong>.
            </Text>
            
            <Section style={statusBadgeContainer}>
                <Text style={{ ...statusBadge, backgroundColor: getStatusColor(newStatus) }}>
                    {newStatus.toUpperCase()}
                </Text>
            </Section>

            <Text style={text}>
              Please log in to your dashboard to see the latest updates, feedback, or any next steps requested by the employer.
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Link href="https://skillsync-platform.vercel.app/dashboard" style={button}>
                Check Status
            </Link>
          </Section>

          <Text style={footer}>
            SkillSync — Your Student Career Hub.<br />
            Securing your future with professional matches.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default StatusUpdateEmail;

const main = {
  backgroundColor: '#0f172a',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  width: '580px',
  maxWidth: '100%',
};

const logoSection = {
  marginBottom: '40px',
  textAlign: 'center' as const,
};

const logoText = {
  color: '#ea580c',
  fontSize: '24px',
  fontWeight: '900',
  letterSpacing: '2px',
  margin: '0',
};

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const contentSection = {
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  borderRadius: '16px',
  padding: '24px',
  margin: '20px 0',
  border: '1px solid rgba(255, 255, 255, 0.05)',
};

const statusBadgeContainer = {
    textAlign: 'center' as const,
    margin: '20px 0',
};

const statusBadge = {
    color: '#fff',
    fontSize: '12px',
    fontWeight: '900',
    letterSpacing: '1px',
    padding: '8px 16px',
    borderRadius: '100px',
    display: 'inline-block',
    margin: '0',
};

const text = {
  color: '#94a3b8',
  fontSize: '16px',
  lineHeight: '26px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
};

const button = {
  backgroundColor: '#ea580c',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 24px',
  boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.2)',
};

const footer = {
  color: '#475569',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '60px',
  lineHeight: '20px',
};
