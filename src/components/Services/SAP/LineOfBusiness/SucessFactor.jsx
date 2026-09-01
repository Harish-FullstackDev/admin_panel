import React from "react";
import backgroundImage from "../../../assets/Solution/ContentBG.svg";
import ContentHeader from "@/components/CommonComponents/ContentHeader";
import ContentCardSection from "@/components/CommonComponents/ContentCardSection";
import ContentFeatureSection from "@/components/CommonComponents/ContentFeatureSection";
import Photo from "../../../assets/Solution/Rectangle.svg";
import WhyContentSection from "@/components/CommonComponents/ContentWhySection";
import ContentConsultation from "@/components/CommonComponents/ContentConsultationSection";
import Footer from "@/components/Footer/Footer";

const SuccessFactors = () => {
  return (
    <>
      <ContentHeader
        backgroundImage={backgroundImage}
        subtitle="We are your trusted partners in innovation."
        title="Success Factors"
        description="Our team is committed to providing an unparalleled
      experience for our clients. With Support Studio, you can
      anticipate outstanding customer service, cutting-edge
      solutions, and a dedication to achieving tangible results
      for your business."
        highlights={[
          "Real-time insights",
          "End-to-End Visibility",
          "Advanced Automation",
          "Flexibility and Scalability",
          "Security & Compliance",
        ]}
      />
      <ContentCardSection
        heading={
          <>
            Success
            <span className="gradient-text">Factors</span>
          </>
        }
        description="Success Factors is a deployment option of SAP's next-generation enterprise resource planning (ERP) suite. Unlock the full potential of your enterprise with SAP S/4HANA On-Premises, the leading-edge ERP solution designed to elevate your business operations to new heights. Seamlessly integrating cutting-edge technology with unparalleled functionality,"
        cards={[
          {
            title: "Customization & Control",
            text: "Organizations customize configurations, control access, manage workflows, ensure compliance, and optimize system performance for SAP environments.",
          },
          {
            title: "Analytics & Insights",
            text: "Organizations must provide and maintain hardware, IT infrastructure, apply updates, patches, manage security, and ensure high availability and disaster recovery.",
          },
        ]}
        buttonText="Contact Us"
      />
      <ContentFeatureSection
        headText="Transformative Capabilities"
        title="Real-time insights"
        description="Achieve complete visibility into every aspect of your business processes, enhancing operational efficiency across various departments such as finance, supply chain, sales, and customer service. This holistic approach ensures seamless integration and optimization, driving overall business performance and fostering a more responsive and agile organization."
        imageSrc={Photo.src}
      />

      <ContentFeatureSection
        title="End-to-End Visibility"
        description="Achieve complete visibility into every aspect of your business processes, enhancing operational efficiency across various departments such as finance, supply chain, sales, and customer service. This holistic approach ensures seamless integration and optimization, driving overall business performance and fostering a more responsive and agile organization."
        imageSrc={Photo.src}
        reverse={true} // image on right, content on left
      />
      <ContentFeatureSection
        title="Real-time insights"
        description="Achieve complete visibility into every aspect of your business processes, enhancing operational efficiency across various departments such as finance, supply chain, sales, and customer service. This holistic approach ensures seamless integration and optimization, driving overall business performance and fostering a more responsive and agile organization."
        imageSrc={Photo.src}
      />

      <ContentFeatureSection
        title="End-to-End Visibility"
        description="Achieve complete visibility into every aspect of your business processes, enhancing operational efficiency across various departments such as finance, supply chain, sales, and customer service. This holistic approach ensures seamless integration and optimization, driving overall business performance and fostering a more responsive and agile organization."
        imageSrc={Photo.src}
        reverse={true} // image on right, content on left
      />
      <WhyContentSection
        title="Why choose"
        titleHighlight="Rise with SAP"
        backgroundColor="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100"
        accentColor="blue"
        features={[
          {
            icon: "⚡",
            title: "Lightning Fast",
            description:
              "Experience blazing fast performance with our optimized infrastructure.",
          },
          {
            icon: "🔒",
            title: "Enterprise Security",
            description:
              "Bank-level security protocols protect your sensitive business data.",
          },
          {
            icon: "📈",
            title: "Scalable Growth",
            description:
              "Grow your business without limits with our scalable architecture.",
          },
        ]}
      />
      <ContentConsultation
        bgImage="/SolutionPage/ConsulationBg.png"
        title="Ready To Optimize Your Business Operations With SAP?"
        description="Contact us today for a personalized consultation and see how our solutions can help your business."
      />
      <Footer />
    </>
  );
};

export default SuccessFactors;
