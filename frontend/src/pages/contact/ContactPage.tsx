import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  Headphones,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setIsSubmitted(false);
    }, 3000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-display font-bold text-gray-900 mb-4">Get In Touch</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Have a question or need assistance? We're here to help! Reach out to us anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Contact Cards */}
          {[
            {
              icon: Phone,
              title: 'Call Us',
              info: '+1 (555) 123-4567',
              subInfo: 'Mon-Fri 9am-6pm EST',
              color: 'from-blue-500 to-blue-600',
              bgColor: 'bg-blue-50',
              textColor: 'text-blue-600',
            },
            {
              icon: Mail,
              title: 'Email Us',
              info: 'support@vicishop.com',
              subInfo: 'We reply within 24 hours',
              color: 'from-[#FF6B8B] to-[#FF8E53]',
              bgColor: 'bg-[#FFF0F3]',
              textColor: 'text-[#FF6B8B]',
            },
            {
              icon: MapPin,
              title: 'Visit Us',
              info: '123 Commerce Street',
              subInfo: 'New York, NY 10001',
              color: 'from-[#4ECDC4] to-[#44A3A0]',
              bgColor: 'bg-[#E6FFFA]',
              textColor: 'text-[#4ECDC4]',
            },
          ].map((contact) => {
            const Icon = contact.icon;
            return (
              <div
                key={contact.title}
                className="bg-white rounded-3xl shadow-card border border-gray-100 p-8 hover:shadow-lg transition-all group"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${contact.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{contact.title}</h3>
                <p className="text-lg font-semibold text-gray-700 mb-1">{contact.info}</p>
                <p className="text-sm text-gray-500">{contact.subInfo}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-card border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[#FFF0F3] rounded-xl">
                  <MessageCircle className="w-6 h-6 text-[#FF6B8B]" />
                </div>
                <h2 className="text-2xl font-display font-bold text-gray-900">Send us a Message</h2>
              </div>

              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent Successfully!</h3>
                  <p className="text-gray-500">We'll get back to you as soon as possible.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name" className="text-gray-700 font-bold mb-2">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        required
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="h-12 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#FF6B8B]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-gray-700 font-bold mb-2">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="h-12 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#FF6B8B]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="phone" className="text-gray-700 font-bold mb-2">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="h-12 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#FF6B8B]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject" className="text-gray-700 font-bold mb-2">
                        Subject *
                      </Label>
                      <Input
                        id="subject"
                        type="text"
                        required
                        placeholder="How can we help?"
                        value={formData.subject}
                        onChange={(e) => handleChange('subject', e.target.value)}
                        className="h-12 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#FF6B8B]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-gray-700 font-bold mb-2">
                      Message *
                    </Label>
                    <textarea
                      id="message"
                      required
                      rows={6}
                      placeholder="Tell us more about your inquiry..."
                      value={formData.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#FF6B8B] focus:outline-none focus:bg-white transition-all resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-gradient-to-r from-[#FF6B8B] to-[#FF8E53] hover:from-[#E64A6B] hover:to-[#E67D42] text-white font-bold text-lg rounded-xl shadow-lg hover:-translate-y-1 transition-all"
                  >
                    {isSubmitting ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* FAQ Link */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl shadow-card p-8 text-white">
              <Headphones className="w-12 h-12 mb-4" />
              <h3 className="text-2xl font-bold mb-3">Need Quick Answers?</h3>
              <p className="mb-6 text-purple-100">
                Check out our FAQ section for instant answers to common questions.
              </p>
              <Button variant="outline" className="w-full bg-white text-purple-600 hover:bg-purple-50 font-bold border-0 rounded-xl">
                Visit FAQ
              </Button>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-3xl shadow-card border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#E6FFFA] rounded-lg">
                  <Clock className="w-6 h-6 text-[#4ECDC4]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Business Hours</h3>
              </div>
              <div className="space-y-3">
                {[
                  { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM' },
                  { day: 'Saturday', hours: '10:00 AM - 4:00 PM' },
                  { day: 'Sunday', hours: 'Closed' },
                ].map((schedule) => (
                  <div key={schedule.day} className="flex justify-between text-sm">
                    <span className="font-semibold text-gray-700">{schedule.day}</span>
                    <span className="text-gray-500">{schedule.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-3xl shadow-card border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Follow Us</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Facebook, name: 'Facebook', color: 'hover:bg-blue-600' },
                  { icon: Instagram, name: 'Instagram', color: 'hover:bg-pink-600' },
                  { icon: Twitter, name: 'Twitter', color: 'hover:bg-sky-500' },
                  { icon: Linkedin, name: 'LinkedIn', color: 'hover:bg-blue-700' },
                ].map((social) => {
                  const Icon = social.icon;
                  return (
                    <button
                      key={social.name}
                      className={`flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl ${social.color} transition-colors font-semibold text-sm`}
                    >
                      <Icon className="w-4 h-4" />
                      {social.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Map Section (Placeholder) */}
        <div className="mt-16 bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden">
          <div className="h-96 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Interactive map would be displayed here</p>
              <p className="text-sm text-gray-400 mt-2">123 Commerce Street, New York, NY 10001</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
