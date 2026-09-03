import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseClient";

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")          // Replace spaces with -
    .replace(/[^\w\-]+/g, "")       // Remove all non-word chars
    .replace(/\-\-+/g, "-")         // Replace multiple - with single -
    .replace(/^-+/, "")             // Trim - from start
    .replace(/-+$/, "");            // Trim - from end
}

async function uploadImage(supabase, file, prefix) {
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${prefix}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const path = `uploads/${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("blog-images")
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage.from("blog-images").getPublicUrl(path);
  return publicUrl;
}

function parseFields(formData) {
  return {
    title: formData.get("title"),
    author: formData.get("author"),
    category: formData.get("category"),
    summary: formData.get("summary"),
    publishDate: formData.get("publish_date"),
    metaLine: formData.get("meta_line"),
    tagsRaw: formData.get("tags"),
    highlightsRaw: formData.get("highlights"),
    sectionsRaw: formData.get("sections"),
    coverImageFile: formData.get("image"),
  };
}

async function resolveSections(supabase, formData, sections) {
  const processedSections = [];
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    let sectionImageUrl = section.image;

    if (section.image && typeof section.image === "string" && section.image.startsWith("section_image_")) {
      const fileKey = section.image;
      const sectionImageFile = formData.get(fileKey);

      if (sectionImageFile) {
        sectionImageUrl = await uploadImage(supabase, sectionImageFile, `sec-${i}`);
      }
    }

    processedSections.push({
      heading: section.heading?.trim() || "",
      content: section.content?.trim() || "",
      image: sectionImageUrl,
      caption: section.caption?.trim() || null
    });
  }
  return processedSections;
}

// GET all case studies ordered by created_at DESC
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: caseStudies, error } = await supabase
      .from("case_studies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, caseStudies });
  } catch (err) {
    console.error("GET Case Studies API Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve case studies collection." },
      { status: 500 }
    );
  }
}

// POST: Create a new case study
export async function POST(request) {
  try {
    const formData = await request.formData();
    const {
      title, author, category, summary, publishDate, metaLine,
      tagsRaw, highlightsRaw, sectionsRaw, coverImageFile
    } = parseFields(formData);

    if (!title?.trim() || !author?.trim() || !category?.trim() || !summary?.trim() || !publishDate || !coverImageFile || !sectionsRaw) {
      return NextResponse.json(
        { error: "Title, author, category, summary, publish date, cover image, and sections are required." },
        { status: 400 }
      );
    }

    const tags = tagsRaw ? JSON.parse(tagsRaw) : [];
    const highlights = highlightsRaw ? JSON.parse(highlightsRaw) : [];
    const sections = JSON.parse(sectionsRaw);
    const supabase = createAdminClient();

    // 1. Generate unique slug from title
    let slug = slugify(title);
    const { data: existingCaseStudies } = await supabase
      .from("case_studies")
      .select("id")
      .eq("slug", slug);

    if (existingCaseStudies && existingCaseStudies.length > 0) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // 2. Upload cover image
    let coverUrl;
    try {
      coverUrl = await uploadImage(supabase, coverImageFile, "cover");
    } catch (uploadError) {
      console.error("Cover image upload error:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload cover image: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 3. Resolve section images
    const processedSections = await resolveSections(supabase, formData, sections);

    // 4. Insert case study row
    const { data: caseStudyData, error: insertError } = await supabase
      .from("case_studies")
      .insert({
        title: title.trim(),
        slug,
        author: author.trim(),
        category: category.trim(),
        summary: summary.trim(),
        meta_line: metaLine?.trim() || null,
        publish_date: publishDate,
        cover_image: coverUrl,
        tags,
        highlights,
        sections: processedSections,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Case study insert error:", insertError);
      return NextResponse.json(
        { error: `Failed to save case study details: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, caseStudy: caseStudyData }, { status: 201 });

  } catch (err) {
    console.error("Case Study POST API Error:", err);
    return NextResponse.json(
      { error: err.message || "Server error during case study posting." },
      { status: 500 }
    );
  }
}

// PUT: Update an existing case study
export async function PUT(request) {
  try {
    const formData = await request.formData();
    const id = formData.get("id");
    const {
      title, author, category, summary, publishDate, metaLine,
      tagsRaw, highlightsRaw, sectionsRaw, coverImageFile: coverImage
    } = parseFields(formData);

    if (!id || !title?.trim() || !author?.trim() || !category?.trim() || !summary?.trim() || !publishDate || !sectionsRaw) {
      return NextResponse.json(
        { error: "Case study ID, title, author, category, summary, publish date, and sections are required." },
        { status: 400 }
      );
    }

    const tags = tagsRaw ? JSON.parse(tagsRaw) : [];
    const highlights = highlightsRaw ? JSON.parse(highlightsRaw) : [];
    const sections = JSON.parse(sectionsRaw);
    const supabase = createAdminClient();

    // 1. Resolve cover image URL
    let coverUrl = "";
    try {
      if (coverImage && typeof coverImage !== "string") {
        coverUrl = await uploadImage(supabase, coverImage, "cover");
      } else {
        coverUrl = coverImage || "";
      }
    } catch (coverUploadError) {
      console.error("Cover image upload error:", coverUploadError);
      return NextResponse.json(
        { error: `Failed to upload new cover image: ${coverUploadError.message}` },
        { status: 500 }
      );
    }

    // 2. Resolve section images
    const processedSections = await resolveSections(supabase, formData, sections);

    // 3. Generate unique slug if title has changed or matches
    let slug = slugify(title);
    const { data: duplicateCaseStudies } = await supabase
      .from("case_studies")
      .select("id")
      .eq("slug", slug)
      .neq("id", id);

    if (duplicateCaseStudies && duplicateCaseStudies.length > 0) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // 4. Update entry
    const { data: updatedCaseStudy, error: updateError } = await supabase
      .from("case_studies")
      .update({
        title: title.trim(),
        slug,
        author: author.trim(),
        category: category.trim(),
        summary: summary.trim(),
        meta_line: metaLine?.trim() || null,
        publish_date: publishDate,
        cover_image: coverUrl,
        tags,
        highlights,
        sections: processedSections,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Case study update error:", updateError);
      return NextResponse.json(
        { error: `Failed to update case study details: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, caseStudy: updatedCaseStudy });

  } catch (err) {
    console.error("Case Study PUT API Error:", err);
    return NextResponse.json(
      { error: err.message || "Server error during case study updates." },
      { status: 500 }
    );
  }
}

// DELETE: Delete a case study by query ID
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Case study ID is required for deletion." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { error: deleteError } = await supabase
      .from("case_studies")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Case study delete error:", deleteError);
      return NextResponse.json(
        { error: `Failed to delete case study: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Case study successfully deleted." });
  } catch (err) {
    console.error("Case Study DELETE API Error:", err);
    return NextResponse.json(
      { error: err.message || "Server error during case study deletion." },
      { status: 500 }
    );
  }
}
