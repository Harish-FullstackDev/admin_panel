import InsightDetail from "@/components/Insights/InsightDetail";
import { whitepapersData, getWhitepaperBySlug } from "@/data/whitepapersData";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const whitepaper = getWhitepaperBySlug(slug);

    if (!whitepaper) {
        return { title: "Whitepaper Not Found" };
    }

    return {
        title: whitepaper.title,
        description: whitepaper.summary,
        alternates: {
            canonical: `/whitepapers/${slug}`,
        },
        openGraph: {
            type: "article",
            title: whitepaper.title,
            description: whitepaper.summary,
            url: `/whitepapers/${slug}`,
            authors: whitepaper.author ? [whitepaper.author] : undefined,
            images: whitepaper.cover_image
                ? [{ url: whitepaper.cover_image, width: 1200, height: 630, alt: whitepaper.title }]
                : undefined,
        },
        twitter: {
            card: "summary_large_image",
            title: whitepaper.title,
            description: whitepaper.summary,
            images: whitepaper.cover_image ? [whitepaper.cover_image] : undefined,
        },
    };
}

export function generateStaticParams() {
    return whitepapersData.map((item) => ({ slug: item.slug }));
}

export default async function WhitepaperDetailPage({ params }) {
    const { slug } = await params;
    const whitepaper = getWhitepaperBySlug(slug);

    return (
        <InsightDetail item={whitepaper} basePath="/whitepapers" backLabel="Back to Whitepapers" />
    );
}
