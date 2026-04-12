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

interface ApplicationReceivedEmailProps {
  studentName: string;
  internshipTitle: string;
}

export const ApplicationReceivedEmail = ({
  studentName,
  internshipTitle,
}: ApplicationReceivedEmailProps) => (
  <Html>
    <Head />
    <Preview>Your application for {internshipTitle} was received!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
           <Text style={logoText}>SKILLSYNC</Text>
        </Section>
        <Heading style={h1}>Application Received</Heading>
        <Text style={text}>
          Hi {studentName},
        </Text>
        <Section style={contentSection}>
          <Text style={text}>
            Exciting news! We've successfully received your application for the <strong>{internshipTitle}</strong> position.
          </Text>
          <Text style={text}>
            Our team (and the company's hiring managers) are currently reviewing your profile and skill match. 
          </Text>
          <Text style={text}>
            You can track the progress of your application and view your match details at any time in your student dashboard.
          </Text>
        </Section>
        <Section style={buttonContainer}>
           <Link href="https://skillsync-platform.vercel.app/dashboard" style={button}>
              View Dashboard
           </Link>
        </Section>
        <Text style={footer}>
          SkillSync — Your Student Career Hub.<br />
          If you didn't apply for this role, please ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ApplicationReceivedEmail;

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
