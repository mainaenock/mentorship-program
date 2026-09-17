import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Compass,
  Flag,
  GraduationCap,
  HeartHandshake,
  Layers,
  Cpu,
  ShieldCheck,
  Target,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { config } from '../shared/config';
import { ActionLink, Badge, Card, Progress } from '../shared/ui';
import { Faq, Pricing } from './interactive';
export function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}
export function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="pill">
              <span className="dot" /> BIG DREAMS. REAL PROGRESS.
            </div>
            <h1>
              <span className="hero-title-desktop">
                Your goals deserve
                <br />
                more than
                <br />
                <em>“one day.”</em>
              </span>
              <span className="hero-title-mobile">
                Your goals deserve
                <br />
                more than <em>“one day.”</em>
              </span>
            </h1>
            <p>
              Turn what matters to you into a clear plan.
              <br className="desktop-break" /> Build the habits, skills, and connections to get there.
            </p>
            <div className="actions">
              <ActionLink href="/register">
                Start your journey <ArrowUpRight size={19} />
              </ActionLink>
              <ActionLink href="/how-it-works" secondary>
                See how it works <ArrowRight size={18} />
              </ActionLink>
            </div>
            <div className="hero-reassurance">
              <ShieldCheck size={17} /> A supportive space. A pace that works for you.
            </div>
          </div>
          <div className="journey-art" aria-label="Illustrative goal journey">
            <span className="art-label">SMALL STEPS. MEANINGFUL CHANGE.</span>
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="goal-example">
              <div className="row between">
                <span className="mini-label">
                  <span className="goal-icon">
                    <Target size={19} />
                  </span>{' '}
                  MY NEXT CHAPTER
                </span>
                <Badge>In progress</Badge>
              </div>
              <h3>
                Build a career
                <br />
                I’m proud of.
              </h3>
              <p>One clear goal. A world of possibility.</p>
              <Progress value={65} label="Your journey" />
              <div className="example-action">
                <span className="check-circle">
                  <Check size={15} />
                </span>
                <div>
                  <strong>Learn something new</strong>
                  <small>Complete a skill-building lesson</small>
                </div>
                <Check size={17} />
              </div>
              <div className="example-action">
                <span className="check-circle">
                  <Check size={15} />
                </span>
                <div>
                  <strong>Take the next step</strong>
                  <small>Put your learning into practice</small>
                </div>
                <Check size={17} />
              </div>
              <div className="example-next">
                <Compass size={19} /> Next: reflect with your mentor <ArrowRight size={15} />
              </div>
            </div>
            <div className="floating-note mentor-note">
              <span className="note-icon">
                <HeartHandshake size={25} />
              </span>
              <div>
                <strong>You don’t have to do it alone.</strong>
                <small>Guidance when it matters.</small>
              </div>
            </div>
            <div className="floating-note progress-note">
              <span className="note-icon lime">
                <TrendingUp size={23} />
              </span>
              <div>
                <strong>Progress over perfection</strong>
                <small>Every small step counts.</small>
              </div>
            </div>
            <span className="example-caption">An illustrative journey. Your path will be your own.</span>
          </div>
        </div>
      </section>
      <div className="trust-strip">
        <div className="container">
          <span>YOUR POTENTIAL. THE RIGHT SUPPORT.</span>
          <div>
            <Target /> Purposeful goals
          </div>
          <div>
            <BookOpen /> Practical learning
          </div>
          <div>
            <HeartHandshake /> Human connection
          </div>
          <div>
            <ShieldCheck /> Safety at every step
          </div>
        </div>
      </div>
      <section className="section container">
        {(config.impactMetrics.length > 0 || config.partners.length > 0) && (
          <div className="content-grid">
            {config.impactMetrics.map((metric) => (
              <Card key={metric.label}>
                <strong>{metric.value}</strong>
                <h3>{metric.label}</h3>
                <a href={metric.source}>View source</a>
              </Card>
            ))}
            {config.partners.map((partner) => (
              <Card key={partner.name}>
                <a href={partner.href}>{partner.name}</a>
              </Card>
            ))}
          </div>
        )}
        <SectionHeading
          eyebrow="A WAY FORWARD"
          title="Big goals. Small, achievable steps."
          text="You bring the ambition. We help you find your next step—and keep going."
        />
        <div className="steps-grid">
          {[
            {
              icon: Target,
              title: 'Find your direction',
              text: 'Discover what matters and turn it into a meaningful, measurable goal.',
            },
            {
              icon: Layers,
              title: 'Make a plan that fits',
              text: 'Break it down into milestones and everyday actions that work for you.',
            },
            {
              icon: HeartHandshake,
              title: 'Grow with support',
              text: 'Learn new skills, connect with a mentor, and reflect on your progress.',
            },
            {
              icon: Flag,
              title: 'Celebrate. Keep growing.',
              text: 'Recognise every achievement and take your next step with confidence.',
            },
          ].map((item, i) => (
            <div className="step-card" key={item.title}>
              <div className="row between">
                <span className="feature-icon">
                  <item.icon size={25} />
                </span>
                <span className="step-number">0{i + 1}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
        <Link href="/how-it-works" className="text-link">
          Explore the complete journey <ArrowRight size={17} />
        </Link>
      </section>
      <section className="section soft-section">
        <div className="container">
          <div className="row between section-top">
            <SectionHeading
              eyebrow="MAKE IT YOURS"
              title="What do you want to grow?"
              text="There’s no single definition of success. Start with what matters to you."
            />
            <Link href="/goals" className="text-link">
              Explore all goals <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="category-grid">
            {config.categories.map((item, i) => (
              <Link className="category-card" key={item} href={`/goals?category=${encodeURIComponent(item)}`}>
                <span className={`category-symbol color-${i % 4}`}>
                  {item === 'Finance' ? (
                    <WalletCards />
                  ) : item === 'Technology' ? (
                    <Cpu />
                  ) : (
                    [
                      <GraduationCap key="education" />,
                      <TrendingUp key="career" />,
                      <Layers key="business" />,
                    ][i % 3]
                  )}
                </span>
                <strong>{item}</strong>
                <ArrowUpRight size={18} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section container split-section">
        <div className="mentor-visual">
          <div className="mentor-quote">
            <span className="eyebrow">THE POWER OF A CONVERSATION</span>
            <h3>
              “What’s one small step
              <br />
              you could take
              <br />
              <em>this week?</em>”
            </h3>
            <div className="row">
              <span className="round-icon">
                <HeartHandshake />
              </span>
              <span>
                A question to move you forward.<small>Illustrative mentorship conversation</small>
              </span>
            </div>
          </div>
          <span className="visual-caption">LISTEN. REFLECT. MOVE FORWARD.</span>
        </div>
        <div>
          <SectionHeading
            eyebrow="HUMAN SUPPORT, REAL POSSIBILITY"
            title="A little guidance can change your direction."
            text="You’re the author of your journey. A mentor helps you ask better questions, find perspective, and move forward with confidence."
          />
          <ul className="check-list">
            <li>
              <Check /> Mentorship aligned with your goals
            </li>
            <li>
              <Check /> Thoughtful, structured conversations
            </li>
            <li>
              <Check /> A safe and accountable environment
            </li>
          </ul>
          <ActionLink href="/mentorship">
            Discover mentorship <ArrowUpRight size={18} />
          </ActionLink>
          <Link href="/mentor/application" className="text-link">
            Have experience to share? Become a mentor <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <section className="section learning-section">
        <div className="container split-section">
          <div>
            <SectionHeading
              eyebrow="LEARN SOMETHING. DO SOMETHING."
              title="Learning that takes you somewhere."
              text="Connect knowledge to action with resources that support your goals—from a first idea to a confident next step."
            />
            <ActionLink href="/learning">
              Explore learning <ArrowUpRight size={18} />
            </ActionLink>
          </div>
          <div className="learning-stack">
            {[
              ['01', 'Find your focus', 'Guides & practical tools'],
              ['02', 'Build your confidence', 'Lessons & reflective exercises'],
              ['03', 'Put it into practice', 'Activities linked to your goals'],
            ].map(([number, title, text]) => (
              <Card key={number}>
                <span className="step-number">{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                <BookOpen size={23} />
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="safety-callout">
          <ShieldCheck size={40} />
          <div>
            <h2>Room to grow. A space to feel safe.</h2>
            <p>
              Age-appropriate experiences, guardian involvement, and clear safeguarding standards are part of
              the journey.
            </p>
          </div>
          <ActionLink href="/safeguarding" secondary>
            Our commitment <ArrowUpRight size={18} />
          </ActionLink>
        </div>
      </section>
      <section className="section container">
        <SectionHeading
          eyebrow="THE JOURNEYS WE’LL SHARE"
          title="Every goal has a story."
          text="Member stories will be shared here with permission. Until then, explore an illustrative journey and imagine your own."
        />
        <div className="story-preview">
          <div>
            <Badge tone="info">Illustrative example</Badge>
            <h3>
              From “I’d like to learn”
              <br />
              to “look what I built.”
            </h3>
            <p>
              Choose a technology skill. Practise each week. Build a small project. Reflect with a mentor. Set
              your next goal.
            </p>
            <ActionLink href="/success-stories" secondary>
              Explore the journey <ArrowRight size={18} />
            </ActionLink>
          </div>
          <div className="story-art">
            <span>IDEA</span>
            <span>→</span>
            <span>ACTION</span>
            <span>→</span>
            <span className="story-achieve">
              ACHIEVEMENT <Flag />
            </span>
          </div>
        </div>
      </section>
      <section className="section soft-section">
        <div className="container">
          <SectionHeading eyebrow="START WHERE YOU ARE" title="A clear path to getting started." />
          <Pricing compact />
        </div>
      </section>
      <section className="section container narrow">
        <SectionHeading eyebrow="A LITTLE MORE CLARITY" title="Good questions. Clear answers." />
        <Faq compact />
      </section>
      <section className="container final-cta">
        <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
        <h2>
          You don’t need it all figured out.
          <br />
          Just a place to start.
        </h2>
        <p>Take one small step towards something that matters.</p>
        <ActionLink href="/register">
          Start your journey <ArrowUpRight size={19} />
        </ActionLink>
      </section>
    </>
  );
}
